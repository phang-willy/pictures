'use client'

import { useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  Bold,
  CodeXml,
  Italic,
  Link2,
  Minus,
  Strikethrough,
  Underline as UnderlineIcon,
} from 'lucide-react'

type TiptapProps = {
  value: string
  onChange: (value: string) => void
  className?: string
}

const HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const

const Tiptap = ({ value, onChange, className }: TiptapProps) => {
  const [showHtml, setShowHtml] = useState(false)
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkText, setLinkText] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const linkRangeRef = useRef<{ from: number; to: number } | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: 'underline',
        },
      }),
    ],
    content: value || '<p></p>',
    // Don't render immediately on the server to avoid SSR issues
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML())
    },
  })

  useEffect(() => {
    if (!editor) {
      return
    }

    const current = editor.getHTML()
    if (current !== value) {
      editor.commands.setContent(value || '<p></p>', { emitUpdate: false })
    }
  }, [editor, value])

  const activeHeading = HEADING_LEVELS.find((level) =>
    editor?.isActive('heading', { level }),
  )
  const headingValue = activeHeading ? `h${activeHeading}` : 'p'
  const listValue = editor?.isActive('orderedList')
    ? 'ordered'
    : editor?.isActive('bulletList')
      ? 'bullet'
      : 'none'

  const onHeadingChange = (next: string) => {
    if (!editor) {
      return
    }

    const chain = editor.chain().focus()
    if (next === 'p') {
      chain.setParagraph().run()
      return
    }

    if (next === 'h1' || next === 'h2' || next === 'h3') {
      const level = Number(next.slice(1)) as 1 | 2 | 3
      chain.toggleHeading({ level }).run()
    }
  }

  const onListChange = (next: string) => {
    if (!editor) {
      return
    }

    const chain = editor.chain().focus()
    if (next === 'none') {
      if (editor.isActive('bulletList')) {
        chain.toggleBulletList().run()
        return
      }
      if (editor.isActive('orderedList')) {
        chain.toggleOrderedList().run()
      }
      return
    }

    if (next === 'bullet') {
      chain.toggleBulletList().run()
      return
    }

    if (next === 'ordered') {
      chain.toggleOrderedList().run()
    }
  }

  const onOpenLinkDialog = () => {
    if (!editor) {
      return
    }

    const chain = editor.chain().focus()
    if (editor.isActive('link')) {
      chain.extendMarkRange('link').run()
    }

    const { from, to } = editor.state.selection
    linkRangeRef.current = { from, to }

    const sliceText = editor.state.doc.textBetween(from, to, '\n', '')
    setLinkText(sliceText)

    const previousUrl = editor.getAttributes('link').href as string | undefined
    setLinkUrl(previousUrl ?? 'https://')
    setLinkDialogOpen(true)
  }

  const onApplyLink = () => {
    if (!editor || !linkRangeRef.current) {
      return
    }

    const { from, to } = linkRangeRef.current
    const url = linkUrl.trim()
    if (!url) {
      editor
        .chain()
        .focus()
        .setTextSelection({ from, to })
        .extendMarkRange('link')
        .unsetLink()
        .run()
      setLinkDialogOpen(false)
      return
    }

    const displayText = linkText.trim() || url
    const marks = [
      { type: 'link' as const, attrs: { href: url } },
      { type: 'underline' as const },
    ]

    const chain = editor.chain().focus().setTextSelection({ from, to })
    if (from !== to) {
      chain.deleteSelection()
    }
    chain
      .insertContent({
        type: 'text',
        text: displayText,
        marks,
      })
      .run()

    setLinkDialogOpen(false)
    linkRangeRef.current = null
  }

  const onUnsetLink = () => {
    if (!editor) {
      return
    }

    const chain = editor.chain().focus()
    if (linkRangeRef.current) {
      const { from, to } = linkRangeRef.current
      chain.setTextSelection({ from, to })
    }
    chain.extendMarkRange('link').unsetLink().run()
    setLinkDialogOpen(false)
    linkRangeRef.current = null
  }

  const markValues = [
    editor?.isActive('bold') ? 'bold' : null,
    editor?.isActive('underline') ? 'underline' : null,
    editor?.isActive('strike') ? 'strike' : null,
    editor?.isActive('italic') ? 'italic' : null,
  ].filter((value): value is 'bold' | 'underline' | 'strike' | 'italic' =>
    Boolean(value),
  )

  const onMarkValuesChange = (nextValues: string[]) => {
    if (!editor) {
      return
    }

    const has = (mark: 'bold' | 'underline' | 'strike' | 'italic') =>
      nextValues.includes(mark)

    editor.chain().focus()[has('bold') ? 'setBold' : 'unsetBold']().run()
    editor
      .chain()
      .focus()
      [has('underline') ? 'setUnderline' : 'unsetUnderline']()
      .run()
    editor.chain().focus()[has('strike') ? 'setStrike' : 'unsetStrike']().run()
    editor.chain().focus()[has('italic') ? 'setItalic' : 'unsetItalic']().run()
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <Select value={headingValue} onValueChange={onHeadingChange}>
            <SelectTrigger size="sm" className="w-[140px]">
              <SelectValue placeholder="Style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="p">Paragraphe</SelectItem>
              <SelectItem value="h1">Titre 1</SelectItem>
              <SelectItem value="h2">Titre 2</SelectItem>
              <SelectItem value="h3">Titre 3</SelectItem>
            </SelectContent>
          </Select>
          <ButtonGroup>
            <Button
              type="button"
              variant={markValues.includes('bold') ? 'secondary' : 'outline'}
              size="sm"
              aria-label="Gras"
              title="Gras"
              onClick={() =>
                onMarkValuesChange(
                  markValues.includes('bold')
                    ? markValues.filter((mark) => mark !== 'bold')
                    : [...markValues, 'bold'],
                )
              }
              disabled={!editor}
            >
              <Bold />
            </Button>
            <Button
              type="button"
              variant={markValues.includes('underline') ? 'secondary' : 'outline'}
              size="sm"
              aria-label="Souligné"
              title="Souligné"
              onClick={() =>
                onMarkValuesChange(
                  markValues.includes('underline')
                    ? markValues.filter((mark) => mark !== 'underline')
                    : [...markValues, 'underline'],
                )
              }
              disabled={!editor}
            >
              <UnderlineIcon />
            </Button>
            <Button
              type="button"
              variant={markValues.includes('strike') ? 'secondary' : 'outline'}
              size="sm"
              aria-label="Barré"
              title="Barré"
              onClick={() =>
                onMarkValuesChange(
                  markValues.includes('strike')
                    ? markValues.filter((mark) => mark !== 'strike')
                    : [...markValues, 'strike'],
                )
              }
              disabled={!editor}
            >
              <Strikethrough />
            </Button>
            <Button
              type="button"
              variant={markValues.includes('italic') ? 'secondary' : 'outline'}
              size="sm"
              aria-label="Italique"
              title="Italique"
              onClick={() =>
                onMarkValuesChange(
                  markValues.includes('italic')
                    ? markValues.filter((mark) => mark !== 'italic')
                    : [...markValues, 'italic'],
                )
              }
              disabled={!editor}
            >
              <Italic />
            </Button>
          </ButtonGroup>
          <Select value={listValue} onValueChange={onListChange}>
            <SelectTrigger size="sm" className="w-[140px]" disabled={!editor}>
              <SelectValue placeholder="Liste" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Liste</SelectItem>
              <SelectItem value="bullet">Liste à point</SelectItem>
              <SelectItem value="ordered">Liste ordonnée</SelectItem>
            </SelectContent>
          </Select>
          <>
            <Button
              type="button"
              variant={editor?.isActive('link') ? 'secondary' : 'outline'}
              size="sm"
              aria-label="Lien"
              title="Lien"
              onClick={onOpenLinkDialog}
              disabled={!editor}
            >
              <Link2 />
            </Button>
            <Dialog
              open={linkDialogOpen}
              onOpenChange={(open) => {
                setLinkDialogOpen(open)
                if (!open) {
                  linkRangeRef.current = null
                }
              }}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Insérer un lien</DialogTitle>
                  <DialogDescription>
                    Texte affiché et URL. Le soulignement est appliqué par défaut sur le lien.
                  </DialogDescription>
                </DialogHeader>
                <FieldGroup className="gap-3">
                  <Field>
                    <FieldLabel htmlFor="tiptap-link-text">
                      Texte du lien
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id="tiptap-link-text"
                        value={linkText}
                        onChange={(event) => setLinkText(event.target.value)}
                        placeholder="Libellé visible"
                        autoFocus
                      />
                    </FieldContent>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="tiptap-link-url">URL</FieldLabel>
                    <FieldContent>
                      <Input
                        id="tiptap-link-url"
                        value={linkUrl}
                        onChange={(event) => setLinkUrl(event.target.value)}
                        placeholder="https://example.com"
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            onApplyLink()
                          }
                        }}
                      />
                    </FieldContent>
                  </Field>
                </FieldGroup>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={onUnsetLink}>
                    Retirer
                  </Button>
                  <Button type="button" onClick={onApplyLink}>
                    Appliquer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => editor?.chain().focus().setHorizontalRule().run()}
            disabled={!editor}
            aria-label="Séparateur"
            title="Séparateur"
          >
            <Minus />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={showHtml ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setShowHtml((prev) => !prev)}
          >
            <CodeXml />
          </Button>
        </div>
      </div>
      <EditorContent
        editor={editor}
        className={cn(
          'min-h-[120px] rounded-lg border border-input bg-card px-2.5 py-2',
          'prose prose-sm max-w-none dark:prose-invert',
          '[&_.ProseMirror]:min-h-[90px] [&_.ProseMirror]:outline-none',
          '[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6',
          '[&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6',
          '[&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-semibold',
          '[&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-semibold',
          '[&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-semibold',
          '[&_.ProseMirror_a]:underline',
          className,
        )}
      />
      {showHtml ? (
        <pre className="overflow-x-auto rounded-lg border border-input bg-muted/50 p-3 text-xs">
          <code>{value}</code>
        </pre>
      ) : null}
    </div>
  )
}

export default Tiptap