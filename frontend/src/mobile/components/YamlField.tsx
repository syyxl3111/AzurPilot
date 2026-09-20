/**
 * 手机端 YAML 编辑器字段。
 *
 * 与 PC 的 `components/YamlEditor.tsx` 是同一套 CodeMirror 配置（同样的扩展、
 * 同样的语法高亮色 `--syntax-*`，那些令牌现在随 PC 的 tokens.css 一起加载），
 * 区别只有一个：**标题走 prop 而不是 `useApp()`**。PC 那份绑了 PC 的 AppProvider，
 * 手机端没有也不该有那个 Provider，所以无法直接复用。
 *
 * 这二十来行扩展配置是**刻意与 PC 重复**的：另一种做法是把 PC 的 YamlEditor 重构成
 * 「无依赖内核 + PC 包装」，但那要改 PC 源码，而本次的边界是一条 PC 文件都不动。
 * 改扩展集时两处都要改。
 *
 * 组件本身按需加载（`lazy`），CodeMirror 不会进手机端主包。
 */
import { useEffect, useRef } from 'react'
import { Annotation, Compartment, EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { HighlightStyle, syntaxHighlighting, bracketMatching } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { yaml } from '@codemirror/lang-yaml'

const colors = HighlightStyle.define([
  {tag: [tags.propertyName, tags.definition(tags.propertyName)], color: 'var(--syntax-key)'},
  {tag: tags.string, color: 'var(--syntax-string)'},
  {tag: [tags.content, tags.number, tags.bool, tags.null, tags.labelName, tags.typeName, tags.keyword], color: 'var(--syntax-value)'},
  {tag: tags.comment, color: 'var(--syntax-comment)', fontStyle: 'italic'},
  {tag: [tags.punctuation, tags.meta], color: 'var(--syntax-punctuation)'},
])
const externalChange = Annotation.define<boolean>()

export function YamlField({id, value, onChange, disabled = false, heading, ariaLabel, invalid}: {
  id: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  /** 卡片里的标题，由调用方翻译好传进来 */
  heading: string
  ariaLabel: string
  invalid?: boolean
}) {
  const host = useRef<HTMLDivElement>(null)
  const view = useRef<EditorView>(undefined)
  const change = useRef(onChange)
  const initial = useRef(value)
  const editable = useRef(new Compartment())
  change.current = onChange
  useEffect(() => {
    const editor = new EditorView({
      parent: host.current!,
      state: EditorState.create({doc: initial.current, extensions: [
        yaml(), lineNumbers(), history(), bracketMatching(), highlightActiveLine(),
        syntaxHighlighting(colors), EditorView.lineWrapping,
        // 保留 Tab 的浏览器焦点导航；YAML 输入使用语言扩展自动缩进。
        keymap.of([...defaultKeymap, ...historyKeymap]),
        editable.current.of([]),
        EditorView.contentAttributes.of({id, 'aria-label': ariaLabel, 'aria-multiline': 'true', role: 'textbox'}),
        EditorView.updateListener.of(update => {
          if (update.docChanged && update.transactions.some(transaction => !transaction.annotation(externalChange))) {
            change.current(update.state.doc.toString())
          }
        }),
      ]}),
    })
    view.current = editor
    return () => {editor.destroy(); view.current = undefined}
  }, [id, ariaLabel])
  useEffect(() => {
    const editor = view.current
    // 外部回填不能再次触发表单变更
    if (editor && editor.state.doc.toString() !== value) {
      editor.dispatch({changes: {from: 0, to: editor.state.doc.length, insert: value}, annotations: externalChange.of(true)})
    }
  }, [value, id, ariaLabel])
  useEffect(() => {
    view.current?.dispatch({effects: editable.current.reconfigure([
      EditorState.readOnly.of(disabled), EditorView.editable.of(!disabled),
      EditorView.contentAttributes.of({
        'aria-disabled': String(disabled),
        'aria-invalid': String(!!invalid),
        ...(invalid ? {'aria-describedby': `${id}-status`} : {}),
      }),
    ])})
  }, [disabled, invalid, id, ariaLabel])
  return <div aria-invalid={invalid || undefined} className={`yaml-editor ${disabled ? 'is-disabled' : ''}`}>
    <div className="editor-heading">{heading}</div>
    <div ref={host} />
  </div>
}
