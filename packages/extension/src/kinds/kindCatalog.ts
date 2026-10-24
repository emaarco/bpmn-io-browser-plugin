type KindId = 'bpmn' | 'dmn'

export interface KindDescriptor {
  readonly id: KindId
  readonly label: string
  readonly extensions: readonly string[]
  readonly diffable: boolean
}

export const BPMN: KindDescriptor = {
  id: 'bpmn',
  label: 'BPMN',
  extensions: ['bpmn'],
  diffable: true,
}

export const DMN: KindDescriptor = { id: 'dmn', label: 'DMN', extensions: ['dmn'], diffable: false }

export const KIND_CATALOG: readonly KindDescriptor[] = [BPMN, DMN]
