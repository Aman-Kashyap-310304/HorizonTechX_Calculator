class StandardCalculator {
    constructor(previousOperandTextElement, currentOperandTextElement) {
        this.previousOperandTextElement = previousOperandTextElement;
        this.currentOperandTextElement = currentOperandTextElement;
        this.clear();
        
        window.addEventListener('resize', () => this.updateDisplay());
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
        
        // Memory Protection: Limit raw string length before formatting applies
        if (this.currentOperand.replace(/[^0-9]/g, '').length > 25) return;

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

        let result = parseFloat(pass1[0]);
        for (let i = 1; i < pass1.length; i += 2) {
            let operator = pass1[i];
            let next = parseFloat(pass1[i + 1]);
            
            if (operator === '+') result += next;
            if (operator === '-') result -= next;
        }

        // Clean up JS float errors only on reasonable numbers to protect massive 'e' calculations
        if (Math.abs(result) < 1e12) {
            result = Math.round(result * 10000000000) / 10000000000;
        }

        this.currentOperand = result.toString();
        this.history = []; 
        this.isComputed = true;
    }

    calculatePercentage() {
        if (this.currentOperand === '0') return;
        const current = parseFloat(this.currentOperand);
        this.currentOperand = (current / 100).toString();
    }

    formatDisplayNumber(numStr) {
        if (numStr === 'NaN' || numStr === 'Infinity' || numStr === '-Infinity') return 'Error';
        
        let str = numStr.toString();
        
        // Auto convert to scientific notation if > 20 digits to prevent horizontal overflow
        if (str.toLowerCase().includes('e') || str.replace(/[^0-9]/g, '').length > 20) {
            const parsed = parseFloat(str);
            if (!isNaN(parsed)) {
                return parsed.toExponential(6); 
            }
        }
        return str;
    }

    // --- Core UX Fix: High-Performance Mathematical Auto-Scaling ---
    autoScaleFont(element) {
        // 1. Temporarily disable CSS transitions to take an instant, invisible measurement
        element.style.transition = 'none';
        element.style.fontSize = '4.5rem';
        
        // 2. Measure the raw, unconstrained text width
        const parentWidth = element.parentElement.clientWidth - 40; 
        const textWidth = element.scrollWidth;

        // 3. Mathematically scale the font down in a single frame if it overflows
        if (textWidth > parentWidth) {
            // (parentWidth / textWidth) gets the perfect scale ratio. 
            // 0.95 acts as a slight safety buffer so the text doesn't touch the very edge.
            let newSize = 4.5 * (parentWidth / textWidth) * 0.95; 
            
            // Set a hard floor limit
            if (newSize < 1.2) newSize = 1.2;
            
            element.style.fontSize = `${newSize}rem`;
        }

        // 4. Restore the smooth transition for the user's next keystroke
        requestAnimationFrame(() => {
            element.style.transition = 'font-size 0.05s ease-out';
        });
    }

    updateDisplay() {
        const formattedOperand = this.formatDisplayNumber(this.currentOperand);
        
        this.currentOperandTextElement.innerText = formattedOperand;
        this.previousOperandTextElement.innerText = this.history.join(' ');

        // Trigger measurement directly after text changes
        this.autoScaleFont(this.currentOperandTextElement);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    
    // --- CSS Injection: The "Anti-Dancing" UI Lock ---
    const styleBlock = document.createElement('style');
    styleBlock.innerHTML = `
        #current-operand {
            height: 85px;          /* Locks container height permanently */
            line-height: 85px;     /* Anchors text vertically so shrinking font doesn't jump */
            text-align: right;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis; /* Graceful fallback if text hits minimum floor size */
            width: 100%;
        }
        #previous-operand {
            min-height: 35px;      /* Prevents top row from shifting */
            margin-bottom: 5px;
        }
        .display-area {
            justify-content: flex-end !important;
        }
    `;
    document.head.appendChild(styleBlock);

    const previousOperandTextElement = document.getElementById('previous-operand');
    const currentOperandTextElement = document.getElementById('current-operand');
    
    // Strip old bootstrap font classes that interfere with our JS mathematical scaling
    currentOperandTextElement.classList.remove('display-1', 'display-2', 'display-3', 'display-4', 'display-5', 'display-6');
    
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

        // --- Hardware Keyboard Listeners ---
        document.addEventListener('keydown', (event) => {
            if(!standardMode.classList.contains('active')) return;

            const isNumber = /^[0-9]$/.test(event.key) || (event.code.startsWith('Numpad') && event.code.length === 7);
            const isDecimal = event.key === '.' || event.code === 'NumpadDecimal';

            if (isNumber) {
                const num = event.code.startsWith('Numpad') ? event.code.slice(-1) : event.key;
                calculator.appendNumber(num);
                calculator.updateDisplay();
            }
            if (isDecimal) {
                calculator.appendNumber('.');
                calculator.updateDisplay();
            }
            
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