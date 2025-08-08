# ddu-source-input\_history

input history source for ddu.vim

This source collects input histories from items.

Note: It must be called from UI plugin.

Note: It does not close current UI.

## Required

### denops.vim

https://github.com/vim-denops/denops.vim

### ddu.vim

https://github.com/Shougo/ddu.vim

## Configuration

```vim
call ddu#custom#patch_global(#{
    \   sourceOptions: #{
    \     input_history: #{
    \       defaultAction: 'input',
    \     },
    \   }
    \ })
```
