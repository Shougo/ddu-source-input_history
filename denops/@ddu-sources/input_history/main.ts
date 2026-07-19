import {
  ActionFlags,
  type Actions,
  type Context,
  type DduItem,
  type DduOptions,
  type Item,
} from "@shougo/ddu-vim/types";
import { BaseSource } from "@shougo/ddu-vim/source";

import type { Denops } from "@denops/std";
import * as fn from "@denops/std/function";

type ActionData = {
  input: string;
  name: string;
};

type Params = {
  name: string;
};

const MAX_HISTORY_ITEMS = 1000;

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
        const count = Math.min(histnr, MAX_HISTORY_ITEMS);
        const hists = [] as string[];

        for (let i = histnr - count + 1; i <= histnr; i++) {
          hists.push(await fn.histget(args.denops, "input", i));
        }

        controller.enqueue(
          hists.reverse().map((hist) => {
            return {
              word: hist,
              action: {
                input: hist,
                name: args.sourceParams.name,
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
        if (args.items.length === 0) {
          return Promise.resolve(ActionFlags.None);
        }

        const name = (args.items[0].action as ActionData).name;

        // NOTE: Restore current ddu
        await args.denops.dispatcher.pop(name, {
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

          await args.denops.dispatcher.updateOptions(name, {
            input,
          });
        }

        await args.denops.dispatcher.redraw(name, {
          method: "refreshItems",
        });

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
        if (args.items.length === 0) {
          return Promise.resolve(ActionFlags.None);
        }

        const name = (args.items[0].action as ActionData).name;

        // NOTE: Restore current ddu
        await args.denops.dispatcher.pop(name, {
          sync: true,
        });

        for (const item of args.items) {
          const action = item?.action as ActionData;
          const input = action.input;

          await args.denops.dispatcher.updateOptions(name, {
            input,
          });
        }

        await args.denops.dispatcher.redraw(name, {
          method: "refreshItems",
        });

        return Promise.resolve(ActionFlags.None);
      },
    },
  };

  override params(): Params {
    return {
      name: "",
    };
  }
}
