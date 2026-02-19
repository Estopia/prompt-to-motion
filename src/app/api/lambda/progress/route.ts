import {
  AwsRegion,
  getRenderProgress,
  speculateFunctionName,
} from "@remotion/lambda/client";
import { DISK, RAM, REGION, TIMEOUT } from "../../../../../config.mjs";
import { ProgressRequest, ProgressResponse } from "../../../../../types/schema";
import { requireAuth } from "../../../../lib/auth";
import { executeApi } from "../../../../helpers/api-response";

const handler = executeApi<ProgressResponse, typeof ProgressRequest>(
  ProgressRequest,
  async (req, body) => {
    const renderProgress = await getRenderProgress({
      bucketName: body.bucketName,
      functionName: speculateFunctionName({
        diskSizeInMb: DISK,
        memorySizeInMb: RAM,
        timeoutInSeconds: TIMEOUT,
      }),
      region: REGION as AwsRegion,
      renderId: body.id,
    });

    if (renderProgress.fatalErrorEncountered) {
      return {
        type: "error",
        message: renderProgress.errors[0].message,
      };
    }

    if (renderProgress.done) {
      return {
        type: "done",
        url: renderProgress.outputFile as string,
        size: renderProgress.outputSizeInBytes as number,
      };
    }

    return {
      type: "progress",
      progress: Math.max(0.03, renderProgress.overallProgress),
    };
  },
);

export async function POST(req: Request) {
  try {
    await requireAuth();
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }
  return handler(req);
}
