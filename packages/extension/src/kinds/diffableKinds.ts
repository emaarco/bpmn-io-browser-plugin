import { BpmnKind } from './bpmn/BpmnKind'
import { KindRegistry } from './KindRegistry'

export const diffableKinds = new KindRegistry([new BpmnKind()])
