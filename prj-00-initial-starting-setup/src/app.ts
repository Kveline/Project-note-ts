// Validation logic
interface Validatable{
    value: string | number,
    required?: boolean,
    minLength?: number,
    maxLength?: number,
    // min and max for number 
    min?: number,
    max?: number
}

function validate(validatableInput: Validatable): boolean{
    let isValid = true;
    if(validatableInput.required){
        isValid = isValid && validatableInput.value.toString().trim().length !== 0
    }
    if(validatableInput.minLength != null && typeof validatableInput.value === 'string'){
        isValid = isValid && validatableInput.value.length > validatableInput.minLength;
    }
    if(validatableInput.maxLength != null && typeof validatableInput.value === 'string'){
        isValid = isValid && validatableInput.value.length > validatableInput.maxLength;
    }
    if(validatableInput.min != null && typeof validatableInput.value === 'number'){
        isValid = isValid && validatableInput.value > validatableInput.min;
    }
    if(validatableInput.max != null && typeof validatableInput.value === 'number'){
        isValid = isValid && validatableInput.value < validatableInput.max;
    }
    return isValid;
}


// auto bind decorator
// kasih underscore sebelum nama parameter, biar ga kena error parameter unused
function autoBind(_target: any, _methodName: string, descriptor: PropertyDescriptor){
    const originalMethod = descriptor.value;
    const adjustedDescriptor: PropertyDescriptor = {
        configurable: true,
        get(){
            const boundFunction = originalMethod.bind(this);
            return boundFunction;
        }
    };
    return adjustedDescriptor;
}

// ProjectList Class
class ProjectList{
    templateElement: HTMLTemplateElement;  
    hostElement: HTMLDivElement;
    element: HTMLElement;

    constructor(private type: 'active' | 'finished'){
        this.templateElement = <HTMLTemplateElement> document.getElementById('project-list')!; 
        this.hostElement = <HTMLDivElement> document.getElementById('app')!;

        const importedNode = document.importNode(this.templateElement.content, true);
        this.element = <HTMLElement> importedNode.firstElementChild;
        this.element.id = `${this.type}-projects`;
        this.attach();
        this.renderContent();
    }

    private renderContent(){
        const listId = `${this.type}-projects-list`;
        this.element.querySelector('ul')!.id = listId;
        this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + `PROJECTS`;

    }

    private attach(){
        this.hostElement.insertAdjacentElement('beforeend', this.element);
    }
}

// project input Class
class ProjectInput{
    templateElement: HTMLTemplateElement; 
    hostElement: HTMLDivElement;
    element: HTMLFormElement;
    titleInputElement: HTMLInputElement;
    descriptionInputElement: HTMLInputElement;
    peopleInputElement: HTMLInputElement;

    constructor(){
        this.templateElement = <HTMLTemplateElement> document.getElementById('project-input')!; 
        this.hostElement = <HTMLDivElement> document.getElementById('app')!;

        const importedNode = document.importNode(this.templateElement.content, true);
        this.element = <HTMLFormElement> importedNode.firstElementChild;
        this.element.id = 'user-input';

        this.titleInputElement = <HTMLInputElement> this.element.querySelector('#title');
        this.descriptionInputElement = <HTMLInputElement> this.element.querySelector('#description');
        this.peopleInputElement = <HTMLInputElement> this.element.querySelector('#people');

        this.configure();
        this.attach();
    }

    private gatherUserInput(): [string, string, number] | undefined{
        const enteredTitle = this.titleInputElement.value;
        const enteredDescription = this.descriptionInputElement.value;
        const enteredPeople = this.peopleInputElement.value;

        const titleValidatable: Validatable = {
            value: enteredTitle,
            required: true
        }
        const descriptionValidatable: Validatable = {
            value: enteredDescription,
            required: true,
            minLength: 5,
        }
        const peopleValidatable: Validatable = {
            value: enteredPeople,
            required: true,
            min: 1,
            max: 5
        }

        if(
           !validate(titleValidatable) ||
           !validate(descriptionValidatable) ||
           !validate(peopleValidatable)
        ){
            alert("Invalid input, please try again!");
            return;
        } else{
            return [enteredTitle, enteredDescription, +enteredPeople];
        }

    }

    private clearInputs(){
        this.titleInputElement.value = '';
        this.descriptionInputElement.value = '';
        this.peopleInputElement.value = '';
    }

    @autoBind
    private submitHandler(event: Event){
        event.preventDefault();
        console.log(this.titleInputElement.value);
        const userInput = this.gatherUserInput();
        if(Array.isArray(userInput)){
            const [title, desc, people] = userInput;
            console.log(title, desc, people);
            this.clearInputs();
        }
    }

    private configure(){
        this.element.addEventListener("submit", this.submitHandler);
    }

    private attach(){
        this.hostElement.insertAdjacentElement('afterbegin', this.element);
    }
}

const pojectInput = new ProjectInput();
const activeProjectList = new ProjectList("active");
const finishedProjectList = new ProjectList("finished");