class StandardCalculator {
    constructor(previousOperandTextElement, currentOperandTextElement) {
        this.previousOperandTextElement = previousOperandTextElement;
        this.currentOperandTextElement = currentOperandTextElement;
        this.clear();
    }

    clear() {
        this.currentOperand = '0';
        this.history = []; 
        this.isComputed = false; 
    }

    delete() {
        if (this.isComputed) return; 
        if (this.currentOperand === '0') return;
        
        this.currentOperand = this.currentOperand.toString().slice(0, -1);
        if (this.currentOperand === '') this.currentOperand = '0';
    }

    appendNumber(number) {
        if (this.isComputed) {
            this.currentOperand = '0';
            this.isComputed = false;
        }

        if (number === '.' && this.currentOperand.includes('.')) return;
        
        if (this.currentOperand === '0' && number !== '.') {
            this.currentOperand = number.toString();
        } else {
            this.currentOperand = this.currentOperand.toString() + number.toString();
        }
    }

    chooseOperation(operation) {
        const symbolMap = { 'add': '+', 'subtract': '-', 'multiply': '×', 'divide': '÷' };
        const opSymbol = symbolMap[operation];

        if (this.currentOperand === '0' && this.history.length > 0) {
            const lastItem = this.history[this.history.length - 1];
            if (['+', '-', '×', '÷'].includes(lastItem)) {
                this.history[this.history.length - 1] = opSymbol;
                return;
            }
        }

        if (this.currentOperand !== '') {
            this.history.push(this.currentOperand);
            this.history.push(opSymbol);
            this.currentOperand = '0'; 
            this.isComputed = false;
        }
    }

    compute() {
        if (this.history.length === 0) return;
        
        this.history.push(this.currentOperand);

        // Pass 1: Handle Multiplication and Division (BODMAS)
        let pass1 = [];
        for (let i = 0; i < this.history.length; i++) {
            let token = this.history[i];
            
            if (token === '×' || token === '÷') {
                let prev = parseFloat(pass1.pop());
                let next = parseFloat(this.history[++i]); 
                
                if (token === '×') {
                    pass1.push((prev * next).toString());
                } else if (token === '÷') {
                    if (next === 0) {
                        alert("Cannot divide by zero");
                        this.clear();
                        return;
                    }
                    pass1.push((prev / next).toString());
                }
            } else {
                pass1.push(token); 
            }
        }

        // Pass 2: Handle Addition and Subtraction
        let result = parseFloat(pass1[0]);
        for (let i = 1; i < pass1.length; i += 2) {
            let operator = pass1[i];
            let next = parseFloat(pass1[i + 1]);
            
            if (operator === '+') result += next;
            if (operator === '-') result -= next;
        }

        result = Math.round(result * 10000000000) / 10000000000;

        this.currentOperand = result.toString();
        this.history = []; 
        this.isComputed = true;
    }

    calculatePercentage() {
        if (this.currentOperand === '0') return;
        const current = parseFloat(this.currentOperand);
        this.currentOperand = (current / 100).toString();
    }

    updateDisplay() {
        this.currentOperandTextElement.innerText = this.currentOperand;
        this.previousOperandTextElement.innerText = this.history.join(' ');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const previousOperandTextElement = document.getElementById('previous-operand');
    const currentOperandTextElement = document.getElementById('current-operand');
    
    const calculator = new StandardCalculator(previousOperandTextElement, currentOperandTextElement);
    const standardMode = document.getElementById('standard-mode');
    
    if(standardMode) {
        // --- Click Event Listeners ---
        const numberButtons = standardMode.querySelectorAll('.custom-number');
        const operationButtons = standardMode.querySelectorAll('.custom-operator:not(#equals)');
        const equalsButton = document.getElementById('equals');
        const deleteButton = document.getElementById('backspace');
        const clearButton = document.getElementById('clear');
        const percentButton = document.getElementById('percent');

        numberButtons.forEach(button => {
            button.addEventListener('click', () => {
                calculator.appendNumber(button.innerText);
                calculator.updateDisplay();
            });
        });

        operationButtons.forEach(button => {
            button.addEventListener('click', () => {
                calculator.chooseOperation(button.getAttribute('data-action'));
                calculator.updateDisplay();
            });
        });

        equalsButton.addEventListener('click', () => {
            calculator.compute();
            calculator.updateDisplay();
        });

        clearButton.addEventListener('click', () => {
            calculator.clear();
            calculator.updateDisplay();
        });

        deleteButton.addEventListener('click', () => {
            calculator.delete();
            calculator.updateDisplay();
        });

        percentButton.addEventListener('click', () => {
            calculator.calculatePercentage();
            calculator.updateDisplay();
        });

        // --- Supercharged Keyboard Event Listeners ---
        document.addEventListener('keydown', (event) => {
            if(!standardMode.classList.contains('active')) return;

            // Support both standard number row AND hardware Numpad codes
            const isNumber = /^[0-9]$/.test(event.key) || (event.code.startsWith('Numpad') && event.code.length === 7);
            const isDecimal = event.key === '.' || event.code === 'NumpadDecimal';

            if (isNumber) {
                // Extract just the number, whether it comes from "1" or "Numpad1"
                const num = event.code.startsWith('Numpad') ? event.code.slice(-1) : event.key;
                calculator.appendNumber(num);
                calculator.updateDisplay();
            }
            if (isDecimal) {
                calculator.appendNumber('.');
                calculator.updateDisplay();
            }
            
            // Operators (Supporting Numpad specific keys)
            if (event.key === '+' || event.code === 'NumpadAdd') {
                calculator.chooseOperation('add');
                calculator.updateDisplay();
            }
            if (event.key === '-' || event.code === 'NumpadSubtract') {
                calculator.chooseOperation('subtract');
                calculator.updateDisplay();
            }
            if (event.key === '*' || event.key === 'x' || event.code === 'NumpadMultiply') {
                calculator.chooseOperation('multiply');
                calculator.updateDisplay();
            }
            if (event.key === '/' || event.code === 'NumpadDivide') {
                event.preventDefault(); 
                calculator.chooseOperation('divide');
                calculator.updateDisplay();
            }

            // Actions
            if (event.key === 'Enter' || event.key === '=' || event.code === 'NumpadEnter') {
                event.preventDefault(); 
                calculator.compute();
                calculator.updateDisplay();
            }
            if (event.key === 'Backspace') {
                calculator.delete();
                calculator.updateDisplay();
            }
            if (event.key === 'Escape' || event.key === 'Delete') {
                calculator.clear();
                calculator.updateDisplay();
            }
            if (event.key === '%') {
                calculator.calculatePercentage();
                calculator.updateDisplay();
            }
        });
    }
});