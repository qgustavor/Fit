import Part from './part.js'
import Vector from './math/vector.js'

export default class Bin extends Part {

  constructor(id, rawPoints, options) {
    let points = rawPoints.map(e => new Vector(e[0], e[1]))

    super(id, points, options)
    this.rawPoints = rawPoints
    this.isBin = true
  }

  static fromJSON(json) {
    let bin = new Bin(json.id, json.rawPoints, json.options)
    bin.offset = (json.offset !== undefined) ? new Vector(json.offset.x, json.offset.y) : new Vector(0, 0)
    bin.rotation = json.rotation || 0
    bin.groupId = json.groupId
    return bin
  }

  clone() {
    let bin = new Bin(this.id, this.rawPoints, this.options)
    bin.offset = new Vector(this.offset.x, this.offset.y)
    bin.rotation = this.rotation
    bin.groupId = this.groupId
    return bin
  }

  toString() {
    return `bin:${this.id}`
  }

}

