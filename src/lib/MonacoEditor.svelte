<script lang="ts">
import { onMount } from 'svelte';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import { monacoThemes } from './monacoThemes';
import codingFonts from './codingFonts';
import { getCssFontFamily, getFontFeatures } from './fontFeatures';

export let fontFamily = 'JetBrains Mono';
export let fontSize = 20;
export let fontLigatures = true;
export let fontOpenTypeFeatures = true;
export let themeName = 'monokai';
export let language = 'javascript';
export let code = '';

const sampleCodeByLanguage = {
  javascript: `// This is a single-line comment example

/*
 * 1234567890
 * oO08 iIlL1 g9qCGQ 8%& <([{}])> .,;: ~-_=
 *
 * THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG
 *
 * the quick brown fox jumps over the lazy dog
 */

// Defining a function using arrow function syntax
const isMultipleOf = (number, multiple) => {
  if (number === 0) {
    console.log('0 is a neutral element in multiplication.');
    return;
  }

  for (let i = 1; i <= 10; i++) {
    if ((number * i) % multiple === 0) {
      console.log(
        'The number ' + number * i + ' is a multiple of ' + multiple + '.'
      );
    } else {
      console.log(
        'The number ' + number * i + ' is not a multiple of ' + multiple + '.'
      );
    }
  }
};

// Distinguishing between 0, o, O, l, 1, I in variable names and values
let oO0 = 0; // Zero
let l1I = 1; // One

// Calling the function with different parameters
isMultipleOf(oO0, l1I); // Output related to zero
isMultipleOf(l1I, oO0); // Output related to one`,
  python: `import os
import sublime
from pathlib import PurePath

"""
1234567890
oO08 iIlL1 g9qCGQ 8%& <([{}])> .,;: ~-_=

THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG

the quick brown fox jumps over the lazy dog
"""

NUMERALS = 1234567890
SIMILAR = "oO08 iIlL1 g9qCGQ 8%& <([{}])> .,;: ~-_="
DIACRITICS_ETC = "â é ù ï ø ç Ã Ē Æ œ"

class SideBarDuplicateCommand(SideBarCommand):

    def run(self, paths, **kwargs):
        source = self.get_path(paths, **kwargs)
        base, leaf = os.path.split(source)

        # find the file extension
        name, ext = os.path.splitext(leaf)
        if ext != '':
            while '.' in name:
                name, _ext = os.path.splitext(name)
                ext = _ext + ext
                if _ext == '':
                    break

        source = self.get_path(paths, **kwargs)

        input_panel = self.window.show_input_panel(
            'Duplicate As:', source, partial(self.on_done, source), None, None)

        input_panel.sel().clear()
        input_panel.sel().add(
            sublime.Region(len(base) + 1, len(source) - len(ext))`
};

let editor;
let editorContainer;
let monaco;

$: currentFont = codingFonts.find((font) => font.family === fontFamily);
$: fontFeatures = getFontFeatures(
  currentFont,
  fontOpenTypeFeatures,
  fontLigatures
);
$: monacoFontFamily = getCssFontFamily(currentFont) || `'${fontFamily}', monospace`;
$: monacoFontLigatures = fontFeatures || fontLigatures;

onMount(async () => {
  self.MonacoEnvironment = {
    getWorker(_, label) {
      if (label === 'json') {
        return new jsonWorker();
      }
      if (label === 'css' || label === 'scss' || label === 'less') {
        return new cssWorker();
      }
      if (label === 'html' || label === 'handlebars' || label === 'razor') {
        return new htmlWorker();
      }
      if (label === 'typescript' || label === 'javascript') {
        return new tsWorker();
      }
      return new editorWorker();
    }
  };
  monaco = await import('monaco-editor');
  monacoThemes.forEach((theme) => {
    monaco.editor.defineTheme(theme.slug, theme.themeData);
  });
  editor = monaco.editor.create(editorContainer, {
    value: code || sampleCodeByLanguage[language] || sampleCodeByLanguage.javascript,
    language: language,
    theme: 'vs-dark',
    fontFamily: monacoFontFamily,
    fontSize: fontSize,
    fontLigatures: monacoFontLigatures,
    automaticLayout: true,
    minimap: {
      enabled: false
    }
  });
  editor.updateOptions({ theme: themeName });
});

$: if (editor) {
  editor.updateOptions({ theme: themeName });
}

$: if (editor) {
  editor.updateOptions({ fontSize: fontSize });
}

$: if (editor) {
  editor.updateOptions({ fontFamily: monacoFontFamily });
}

$: if (editor) {
  editor.updateOptions({ fontLigatures: monacoFontLigatures });
}

$: if (editor && monaco) {
  const model = editor.getModel();
  if (model) {
    monaco.editor.setModelLanguage(model, language);
    if (!code) {
      model.setValue(sampleCodeByLanguage[language] || sampleCodeByLanguage.javascript);
    }
  }
}
</script>

<div class="{$$props.class} h-full w-full" bind:this="{editorContainer}"></div>
