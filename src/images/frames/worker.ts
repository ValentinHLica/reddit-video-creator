import { readFileSync } from "fs";
import { join } from "path";

import Jimp from "jimp";

import { imageDetails } from "../../config/image";
import { renderPath } from "../../config/paths";
import { Subtitle } from "../../interface/audio";
import { Comment } from "../../interface/post";

const init = async () => {
  const args = process.argv.slice(2);
  const work = JSON.parse(readFileSync(args[0]).toString()) as Comment[][];

  for (const jobs of work) {
    const image = new Jimp(
      imageDetails.width,
      imageDetails.height,
      imageDetails.background
    );

    let positionY =
      imageDetails.height / 2 -
      jobs
        .map((e) => e.height)
        .reduce((prevValue, currentValue) => prevValue + currentValue) /
        2;

    for (const job of jobs) {
      for (const comment of job.content) {
        const commentImagePath = join(
          renderPath,
          job.id + "",
          `${job.id}-${(comment as Subtitle).id}`,
          "image.png"
        );

        const commentImage = await Jimp.read(commentImagePath);

        image.composite(commentImage, 0, positionY);

        await image.writeAsync(commentImagePath);

        console.log("frame-generated");
      }

      positionY += job.height;
    }
  }

  // Kill Worker
  process.exit();
};

init();
