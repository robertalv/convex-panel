import React, { useState, useCallback, useEffect, useRef } from 'react';
import { BeforeMount, OnMount } from '@monaco-editor/react';
import Editor from '@monaco-editor/react';
import { Value } from 'convex/values';
import { useThemeSafe } from '../../hooks/useTheme';
import { setupMonacoThemes, getMonacoTheme } from './monaco-theme';
import { editorOptions } from './editor-options';

const emptyObject = '{\n\n}';

export type ObjectEditorProps = {
  defaultValue?: Value;
  onChange(v?: Value): void;
  onChangeInnerText?(v: string): void;
  onError?(errors: string[]): void;
  path: string;
  className?: string;
  editorClassname?: string;
  multilineClasses?: string;
  fullHeight?: boolean;
  autoFocus?: boolean;
  saveAction?(): void;
  enterSaves?: boolean;
  disableFind?: boolean;
  padding?: boolean;
  showLineNumbers?: boolean;
  disableFolding?: boolean;
  size?: 'sm' | 'md';
  disabled?: boolean;
  fixedOverflowWidgets?: boolean;
  language?: string;
  indentTopLevel?: boolean;
};

export function ObjectEditor(props: ObjectEditorProps) {
  const {
    className,
    editorClassname,
    multilineClasses,
    defaultValue,
    onChange,
    onChangeInnerText,
    onError,
    path,
    fullHeight = false,
    autoFocus = false,
    saveAction,
    disableFind = false,
    enterSaves = false,
    padding = true,
    showLineNumbers = false,
    disableFolding = false,
    size = 'md',
    disabled = false,
    fixedOverflowWidgets = true,
    language = 'javascript',
    indentTopLevel = false,
  } = props;

  const [monaco, setMonaco] = useState<Parameters<BeforeMount>[0]>();
  const { theme } = useThemeSafe();
  const saveActionRef = useRef(saveAction);

  useEffect(() => {
    saveActionRef.current = saveAction;
  }, [saveAction]);

  const [defaultValueString] = useState(() => {
    if (defaultValue === undefined) {
      return '';
    }
    if (JSON.stringify(defaultValue) === '{}') {
      return emptyObject;
    }
    if (JSON.stringify(defaultValue) === '[{}]') {
      return `[${emptyObject}]`;
    }
    return JSON.stringify(defaultValue, null, indentTopLevel ? 2 : 0);
  });

  const numLinesFromCode = (code: string) => code.split('\n').length + 1;
  const [numLines, setNumLines] = useState(numLinesFromCode(defaultValueString));

  const editorLineHeight = size === 'sm' ? 13 : 18;
  const editorHeight = Math.min(Math.max(numLines, 2), 15) * editorLineHeight;

  const handleChange = useCallback(
    (code?: string) => {
      onChangeInnerText && onChangeInnerText(code ?? '');
      setNumLines(code ? numLinesFromCode(code) : 1);

      if (!code || code.trim() === '') {
        onChange(undefined);
        onError?.([]);
        return;
      }

      try {
        const parsed = JSON.parse(code);
        onChange(parsed);
        onError?.([]);
      } catch (e: any) {
        const errorMessage = e instanceof Error ? e.message : 'Invalid JSON';
        onError?.([errorMessage]);
      }
    },
    [onChange, onChangeInnerText, onError],
  );

  const handleBeforeMount: BeforeMount = (monacoInstance) => {
    setupMonacoThemes(monacoInstance);
    setMonaco(monacoInstance);

    monacoInstance.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
      noSuggestionDiagnostics: true,
      diagnosticCodesToIgnore: [7028],
    });
  };

  const handleMount: OnMount = (editor, monacoInstance) => {
    editor.onKeyDown((e) => {
      if (e.keyCode === monacoInstance.KeyCode.Tab) {
        e.preventDefault();
        moveFocus(!e.shiftKey);
      }
    });

    if (disableFind) {
      editor.addAction({
        id: 'find',
        label: 'find',
        keybindings: [monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyF],
        run: () => {},
      });
    }

    if (saveAction) {
      const keybindings = [monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Enter];
      if (enterSaves) {
        keybindings.push(monacoInstance.KeyCode.Enter);
      }
      editor.addAction({
        id: 'saveAction',
        label: 'Save value',
        keybindings,
        run() {
          saveActionRef.current?.();
        },
      });
    }

    if (!autoFocus || disabled) {
      return;
    }

    editor.focus();

    const code = editor.getValue();
    if (!code) {
      return;
    }

    const codeLines = code.trimEnd().split('\n');
    let lastLine = codeLines.pop();
    let isMultiLineObject = false;
    if (lastLine === '}') {
      lastLine = codeLines.pop();
      isMultiLineObject = true;
    }
    if (lastLine === undefined) {
      return;
    }

    const isObject = typeof defaultValue === 'object' && defaultValue !== null && !Array.isArray(defaultValue);
    const isArray = Array.isArray(defaultValue);
    const isString = typeof defaultValue === 'string';
    const column =
      isObject || isArray || (isString && !isMultiLineObject)
        ? lastLine.length : lastLine.length + 1;

    editor.setPosition({
      lineNumber: code.split('\n').length - (isMultiLineObject ? 1 : 0),
      column,
    });
  };

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        minHeight: 16,
        maxHeight: '100%',
        height: fullHeight ? '100%' : editorHeight,
        width: '100%',
        maxWidth: '100%',
        borderRadius: '4px',
        border: '1px solid var(--color-panel-border)',
        ...(numLines > 2 && multilineClasses ? {} : {}),
      }}
      onScroll={(e) => e.stopPropagation()}
    >
      {disabled && (
        <div
          style={{
            position: 'absolute',
            zIndex: 10,
            height: '100%',
            width: '100%',
            cursor: 'not-allowed',
            backgroundColor: 'var(--color-panel-bg-tertiary)',
            opacity: 0.2,
          }}
        />
      )}
      <Editor
        height="100%"
        width="100%"
        className={editorClassname}
        defaultLanguage={language}
        defaultValue={defaultValueString}
        theme={getMonacoTheme(theme)}
        path={path.replace(':', '_')}
        onChange={handleChange}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        options={{
          ...editorOptions,
          contextmenu: false,
          ...(showLineNumbers
            ? {
                lineNumbers: 'on',
                lineNumbersMinChars: 5,
                lineDecorationsWidth: 10,
              }
            : {}),
          ...(size === 'sm' && {
            fontSize: 12,
            lineHeight: 13,
          }),
          readOnly: disabled,
          domReadOnly: disabled,
          tabIndex: disabled ? -1 : undefined,
          folding: !disableFolding,
          fixedOverflowWidgets,
          padding: padding ? { top: 8 } : undefined,
        }}
        loading={null}
      />
    </div>
  );
}

function moveFocus(forward = true) {
  const focusableElements = Array.from(
    document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el: any) => !el.disabled && el.offsetParent !== null);

  const currentIndex = document.activeElement
    ? focusableElements.indexOf(document.activeElement)
    : -1;

  if (currentIndex === -1) {
    return;
  }

  let nextIndex = forward ? currentIndex + 1 : currentIndex - 1;
  if (nextIndex >= focusableElements.length) nextIndex = 0;
  if (nextIndex < 0) nextIndex = focusableElements.length - 1;

  const nextElement = focusableElements[nextIndex];
  if (nextElement && nextElement instanceof HTMLElement) {
    nextElement.focus();
  }
}

