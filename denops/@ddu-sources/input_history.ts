import {
  ActionFlags,
  type Actions,
  type Context,
  type DduItem,
  type DduOptions,
  type Item,
} from "jsr:@shougo/ddu-vim@~10.3.0/types";
import { BaseSource } from "jsr:@shougo/ddu-vim@~10.3.0/source";

import type { Denops } from "jsr:@denops/core@~7.0.0";

import * as fn from "jsr:@denops/std@~7.6.0/function";

type ActionData = {
  input: string;
};

type Params = Record<string, never>;

export class Source extends BaseSource<Params> {
  override gather(args: {
    denops: Denops;
    context: Context;
    options: DduOptions;
    sourceParams: Params;
  }): ReadableStream<Item<ActionData>[]> {
    return new ReadableStream({
      async start(controller) {
        const histnr = await fn.histnr(args.denops, "input");
        const indices = Array.from({ length: histnr }, (_, i) => i + 1);
        const hists = await Promise.all(
          indices.map((i) => fn.histget(args.denops, "input", i)),
        );

        controller.enqueue(
          hists.reverse().map((hist) => {
            return {
              word: hist,
              action: {
                input: hist,
              },
            };
          }),
        );
        controller.close();
      },
    });
  }

  override actions: Actions<Params> = {
    edit: {
      description: "Edit the input.",
      callback: async (args: {
        denops: Denops;
        items: DduItem[];
        kindParams: Params;
        actionParams: unknown;
      }) => {
        // NOTE: It must quit current ddu
        await args.denops.dispatcher.pop(name, {
          quit: true,
          sync: true,
        });

        for (const item of args.items) {
          const action = item?.action as ActionData;
          const input = await fn.input(
            args.denops,
            "New input: ",
            action.input,
          );
          await args.denops.cmd("redraw");
          if (input.length === 0) {
            continue;
          }

          await args.denops.call(
            "ddu#ui#sync_action",
            "updateOptions",
            {
              input,
            },
          );
        }

        await args.denops.call(
          "ddu#ui#do_action",
          "redraw",
          {
            method: "refreshItems",
          },
        );

        return Promise.resolve(ActionFlags.None);
      },
    },
    input: {
      description: "Change the input.",
      callback: async (args: {
        denops: Denops;
        items: DduItem[];
        kindParams: Params;
        actionParams: unknown;
      }) => {
        // NOTE: It must quit current ddu
        await args.denops.dispatcher.pop(name, {
          quit: true,
          sync: true,
        });

        for (const item of args.items) {
          const action = item?.action as ActionData;
          const input = action.input;

          await args.denops.call(
            "ddu#ui#sync_action",
            "updateOptions",
            {
              input,
            },
          );
        }

        await args.denops.call(
          "ddu#ui#do_action",
          "redraw",
          {
            method: "refreshItems",
          },
        );

        return Promise.resolve(ActionFlags.None);
      },
    },
  };

  override params(): Params {
    return {};
  }
}
