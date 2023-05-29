import { ChangeEventHandler } from "react"
import { Type } from "./InputTypes"

export interface InputProperties {
  id?: string,
  type: Type
  value: string | number,
  min?: number,
  max?: number,
  step?: number,
  onChange: ChangeEventHandler<HTMLInputElement>
}