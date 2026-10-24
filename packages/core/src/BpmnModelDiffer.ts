import { BpmnParser } from './adapter/BpmnParser'
import { ModelComparator } from './domain/ModelComparator'
import type { DiagramDiff } from './domain/model'

export class BpmnModelDiffer {
  private readonly parser = new BpmnParser()
  private readonly comparator = new ModelComparator()

  async diff(oldXml: string, newXml: string): Promise<DiagramDiff> {
    const [oldModel, newModel] = await Promise.all([
      this.parser.parse(oldXml),
      this.parser.parse(newXml),
    ])
    return this.comparator.compare(oldModel, newModel)
  }
}
