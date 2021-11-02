import { cpus } from "os";
import cluster from "cluster";
import { mkdirSync, existsSync, writeFileSync } from "fs";
import { join } from "path";

import slugify from "slugify";

import { renderPath, tempPath } from "./config/paths";

import {
  resetTemp,
  createRandomString,
  getFolders,
  roundUp,
} from "./utils/helper";
import { getComments } from "./utils/getComments";
import { createPostTitle } from "./images/postTitle";
import { createCommentImage } from "./images/image";
import { generateVideo, mergeVideos } from "./video/index";
import generateAudio from "./audio/index";
import { generateThumbnail } from "./images/thumbnail";
import { generateShorts } from "./images/shorts";

const test = async () => {
  const { post, exportPath, backgroundPath, cropDetails } = await getComments();

  // const postFolder = join(exportPath, `${postTitle}-${randomString}`);

  // mkdirSync(postFolder);

  await generateThumbnail(
    {
      title: post.title,
      awards: post.all_awardings.map((award) => award.name),
      subreddit: post.subreddit,
    },
    backgroundPath,
    cropDetails,
    exportPath
  );
};

/**
 * Generate single comment tree images
 * @param title Post Title
 * @param comments Comments List
 * @param exportPath Path to export final output
 */
const createPost = async () => {
  try {
    if (cluster.isPrimary) {
      // Check if temp path exists
      if (!existsSync(tempPath)) {
        return;
      }

      await resetTemp();

      await getComments(true);

      for (let index = 0; index < cpus().length; index++) {
        cluster.fork();
      }

      let count = cpus().length;

      cluster.on("exit", async () => {
        count--;

        if (count === 0) {
          const { post, exportPath, backgroundPath, cropDetails } =
            await getComments();

          await createPostTitle({
            awards: post.all_awardings.map((award) => award.name),
            points: roundUp(post.ups),
            title: post.title,
            userName: post.author,
            exportPath: renderPath,
          });

          const randomString = createRandomString(3);
          const postTitle = slugify(post.title, {
            remove: /[*+~.()'"?!:@]/g,
            lower: true,
            strict: true,
          });

          const postFolder = join(exportPath, `${postTitle}-${randomString}`);

          mkdirSync(postFolder);

          await mergeVideos(`video`, renderPath, postFolder);

          await generateThumbnail(
            {
              title: post.title,
              awards: post.all_awardings.map((award) => award.name),
              subreddit: post.subreddit,
            },
            backgroundPath,
            cropDetails,
            postFolder
          );

          writeFileSync(join(postFolder, "data.txt"), post.title);

          await generateShorts(1, postFolder);

          console.log(`process-done=${join(postFolder, `video.mp4`)}`);
        }
      });
    } else {
      const { comments } = await getComments(false);

      const leftComments = comments.length % cpus().length;
      const commentsPerCpu = Math.floor(comments.length / cpus().length);

      const index = cluster.worker.id - 1;
      const numOfComments =
        commentsPerCpu + (index === cpus().length - 1 ? leftComments : 0);
      const startIndex = index !== 0 ? index * commentsPerCpu : 0;
      const endIndex = startIndex + numOfComments;
      const listOfComments = comments.slice(startIndex, endIndex);

      if (listOfComments.length !== 0) {
        const folder = join(
          renderPath,
          `${index + 1}-${createRandomString(4)}`
        );

        mkdirSync(folder);

        for (const comments of listOfComments) {
          await createCommentImage(comments, folder);
        }

        const folders = getFolders(folder);

        for (const currentFolder of folders) {
          const folderPath = join(folder, currentFolder);
          const imagePath = join(folderPath, "image.jpg");
          const textPath = join(folderPath, "text.txt");
          const audioPath = join(folderPath, "audio.wav");
          try {
            const duration = await generateAudio(textPath, audioPath);

            await generateVideo(imagePath, audioPath, folderPath, duration);
          } catch (error) {
            console.log(error);
          }
        }

        await mergeVideos("video", folder, folder);

        console.log("process-merge-done");
      }

      cluster.worker.kill();
    }
  } catch (err) {
    console.log(err);
  }
};

createPost();

// test();
