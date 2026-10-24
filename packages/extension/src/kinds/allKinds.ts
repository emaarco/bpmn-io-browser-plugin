import { BpmnKind } from './bpmn/BpmnKind'
import { DmnKind } from './dmn/DmnKind'
import { KindRegistry } from './KindRegistry'

export const allKinds = new KindRegistry([new BpmnKind(), new DmnKind()])
