export class MathService {
  /**
   * Perform mathematical operations
   * @param operation - The mathematical operation to perform
   * @param a - First number
   * @param b - Second number
   * @returns Result of the mathematical operation
   */
  public async calculateMath(operation: string, a: number, b: number) {
    let result: number

    switch (operation) {
      case 'add':
        result = a + b
        break
      case 'subtract':
        result = a - b
        break
      case 'multiply':
        result = a * b
        break
      case 'divide':
        result = b !== 0 ? a / b : NaN
        break
      case 'power':
        result = Math.pow(a, b)
        break
      default:
        throw new Error('Invalid operation')
    }

    return {
      operation,
      operand1: a,
      operand2: b,
      result,
      expression: `${a} ${this.getOperationSymbol(operation)} ${b} = ${result}`
    }
  }

  private getOperationSymbol(operation: string): string {
    const symbols = {
      add: '+',
      subtract: '-',
      multiply: '*',
      divide: '/',
      power: '^'
    }
    return symbols[operation as keyof typeof symbols] || operation
  }
}
