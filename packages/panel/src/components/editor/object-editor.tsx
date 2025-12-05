import  { useState, useCallback, useEffect, useRef } from 'react';
import Editor from './lazy-editor';
import type { OnMount } from './lazy-editor';
import type { Ace } from 'ace-builds';
import type { Value } from 'convex/values';
import { useThemeSafe } from '../../hooks/useTheme';
import { getConvexPanelTheme } from './editor-theme';
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
    language = 'javascript',
    indentTopLevel = false,
  } = props;

  const { theme } = useThemeSafe();
  const saveActionRef = useRef(saveAction);

  useEffect(() => {
    saveActionRef.current = saveAction;
  }, [saveAction]);

  const formatDefaultValue = useCallback((val: Value | undefined): string => {
    if (val === undefined) {
      return '';
    }
    if (JSON.stringify(val) === '{}') {
      return emptyObject;
    }
    if (JSON.stringify(val) === '[{}]') {
      return `[${emptyObject}]`;
    }
    return JSON.stringify(val, null, indentTopLevel ? 2 : 0);
  }, [indentTopLevel]);

  const [defaultValueString, setDefaultValueString] = useState(() => formatDefaultValue(defaultValue));

  const numLinesFromCode = (code: string) => code.split('\n').length + 1;
  const [numLines, setNumLines] = useState(numLinesFromCode(defaultValueString));
  const editorRef = useRef<Ace.Editor | null>(null);
  const previousDefaultValueRef = useRef<Value | undefined>(defaultValue);

  // Update editor content when defaultValue changes (e.g., when schema loads)
  useEffect(() => {
    const newValueString = formatDefaultValue(defaultValue);
    const previousValueString = formatDefaultValue(previousDefaultValueRef.current);
    
    if (newValueString !== previousValueString && editorRef.current) {
      const currentValue = editorRef.current.getValue();
      // Only update if editor is empty or matches the previous defaultValue
      if (!currentValue || currentValue.trim() === '' || currentValue === previousValueString) {
        editorRef.current.setValue(newValueString, -1);
        setDefaultValueString(newValueString);
        setNumLines(numLinesFromCode(newValueString));
      }
    }
    
    previousDefaultValueRef.current = defaultValue;
  }, [defaultValue, formatDefaultValue]);

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

  const handleMount: OnMount = (aceEditor: Ace.Editor) => {
    editorRef.current = aceEditor;
    aceEditor.commands.addCommand({
      name: 'cp-focus-next',
      bindKey: { win: 'Tab', mac: 'Tab' },
      exec: () => moveFocus(true),
    });
    aceEditor.commands.addCommand({
      name: 'cp-focus-prev',
      bindKey: { win: 'Shift-Tab', mac: 'Shift-Tab' },
      exec: () => moveFocus(false),
    });

    if (disableFind) {
      aceEditor.commands.addCommand({
        name: 'cp-disable-find',
        bindKey: { win: 'Ctrl-F', mac: 'Command-F' },
        exec: () => {},
      });
    }

    if (saveAction) {
      const bindings = enterSaves
        ? [{ win: 'Ctrl-Enter', mac: 'Command-Enter' }, { win: 'Enter', mac: 'Enter' }]
        : [{ win: 'Ctrl-Enter', mac: 'Command-Enter' }];
      bindings.forEach((bindKey) => {
        aceEditor.commands.addCommand({
          name: `cp-save-${bindKey.win}`,
          bindKey,
          exec: () => saveActionRef.current?.(),
        });
      });
    }

    if (!autoFocus || disabled) {
      return;
    }

    aceEditor.focus();

    const code = aceEditor.getValue();
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

    const targetRow = code.split('\n').length - (isMultiLineObject ? 2 : 1);
    aceEditor.gotoLine(targetRow + 1, column, true);
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
        language={language}
        defaultValue={defaultValueString}
        theme={getConvexPanelTheme(theme)}
        path={path.replace(':', '_')}
        onChange={handleChange}
        onMount={handleMount}
        options={{
          ...editorOptions,
          lineNumbers: showLineNumbers ? 'on' : 'off',
          fontSize: size === 'sm' ? 12 : editorOptions?.fontSize ?? 13,
          readOnly: disabled,
          domReadOnly: disabled,
          folding: !disableFolding,
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

