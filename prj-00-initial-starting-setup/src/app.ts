// Drag and Drop Interface
interface Draggable{
    dragStartHandler(event: DragEvent): void;
    dragEndHandler(event: DragEvent): void;
}

interface DragTarget{
    dragOverHandler(event: DragEvent): void;
    dropHandler(event: DragEvent): void;
    dragLeaveHandler(event: DragEvent): void;
}

// Project type
enum ProjectStatus {
    Active, Finished
}

class Project{
    constructor(public id: string, 
                public title: string, 
                public description: string, 
                public people: number, 
                public status: ProjectStatus){}
}


// Project state management (like vuex/redux)
type Listener<T> = (items: T[]) => void;

class State<T> {
     // listeners => to check something changed
     protected listeners: Listener<T>[] = [];

     addListener(listenerFn: Listener<T>){
        this.listeners.push(listenerFn);
    }

}

class ProjectState extends State<Project> {
    private projects: Project[] = [];
    private static instance: ProjectState;

    private constructor(){
        super();
    }

    static getInstance(){
        if(this.instance){
            return this.instance;
        }
        this.instance = new ProjectState();
        return this.instance;
    }

    addProject(title: string, description: string, numOfPeople: number){
        const newProject = new Project
        (Math.random().toString(), 
         title,
         description,
         numOfPeople,
         ProjectStatus.Active);
        this.projects.push(newProject);
        this.updateListeners();
    }

    moveProject(projectId: string, newStatus: ProjectStatus){
       const project =  this.projects.find(prj => prj.id === projectId);
       if(project && project.status !== newStatus) {
           project.status = newStatus;
           this.updateListeners();
       }
    }

    private updateListeners(){
        for(const listenerFn of this.listeners){
            listenerFn(this.projects.slice());
        }
    }
}

// state management initialization
const projectState = ProjectState.getInstance();

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

// Component base class 
abstract class Component<T extends HTMLElement, U extends HTMLElement>{
    templateElement: HTMLTemplateElement;  
    hostElement: T;
    element: U;

    constructor(templateId: string, hostElementId: string, insertAtStart: boolean, newElementId?: string){
        this.templateElement = <HTMLTemplateElement> document.getElementById(templateId)!; 
        this.hostElement = <T> document.getElementById(hostElementId)!; 

        const importedNode = document.importNode(this.templateElement.content, true);
        this.element = <U> importedNode.firstElementChild;
        if(newElementId){
            this.element.id = newElementId;
        }
       this.attach(insertAtStart);
    }

    private attach(insertAtBeginning: boolean){
        this.hostElement.insertAdjacentElement(insertAtBeginning ? 'afterbegin' : 'beforeend', this.element);
    }

    abstract configure(): void;
    abstract renderContent(): void;
}
// Project item class
class ProjectItem extends Component<HTMLUListElement, HTMLLIElement>    implements Draggable {
    private project: Project;
    
    get persons(){
        if(this.project.people === 1) return '1 person';
        else return `${this.project.people} persons`
    }
    
    constructor(hostId: string, project: Project){
        super('single-project', hostId, false, project.id);
        this.project = project;

        this.configure();
        this.renderContent();
    }

    @autoBind
    dragStartHandler(event: DragEvent){
        console.log(event.dataTransfer);
        event.dataTransfer!.setData('text/plain', this.project.id);
        event.dataTransfer!.effectAllowed = 'move';
        
    }

    dragEndHandler(_event: DragEvent){   
        console.log("DragEnd");
    }

    configure(){
        this.element.addEventListener('dragstart', this.dragStartHandler);
        this.element.addEventListener('dragend', this.dragEndHandler);
    }

    renderContent(){
        // render detail project pada template id="single-project"
        this.element.querySelector('h2')!.textContent = this.project.title;
        this.element.querySelector('h3')!.textContent = this.persons + ' assigned';
        this.element.querySelector('p')!.textContent = this.project.description;
    }
}


// ProjectList Class
class ProjectList extends Component<HTMLDivElement, HTMLElement> implements DragTarget{
    assignedProjects: Project[];

    constructor(private type: 'active' | 'finished'){
        super('project-list', 'app', false, `${type}-projects`);
        this.assignedProjects = [];
        this.configure();
        this.renderContent();
    }
    @autoBind
    dragOverHandler(event: DragEvent){
        if(event.dataTransfer && event.dataTransfer.types[0] === 'text/plain'){
            event.preventDefault();
            const listEl = this.element.querySelector('ul')!;
            listEl.classList.add('droppable');
        }
    }

    @autoBind
    dropHandler(event: DragEvent){
       const projectId = event.dataTransfer!.getData('text/plain');
       projectState.moveProject(projectId, this.type === 'active' ? ProjectStatus.Active : ProjectStatus.Finished);

    }

    @autoBind
    dragLeaveHandler(_event: DragEvent){
        const listEl = this.element.querySelector('ul')!;
        listEl.classList.remove('droppable');
    }

    configure(){
        this.element.addEventListener('dragover', this.dragOverHandler);
        this.element.addEventListener('dragleave', this.dragLeaveHandler);
        this.element.addEventListener('drop', this.dropHandler);

        projectState.addListener((projects: Project[]) => {
            const relevantProjects = projects.filter(prj =>  {
                if(this.type === 'active'){
                   return prj.status === ProjectStatus.Active;
                }
                else {
                    return prj.status === ProjectStatus.Finished;
                }
               
            } );
            this.assignedProjects = relevantProjects;
            this.renderProjects();
        });
    };

    renderContent(){
        const listId = `${this.type}-projects-list`;
        this.element.querySelector('ul')!.id = listId;
        this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + `PROJECTS`;

    }

    private renderProjects(){
        const listEl = <HTMLUListElement> document.getElementById(`${this.type}-projects-list`)!;
        listEl.innerHTML = '';
        for(const projectItem of this.assignedProjects){
           new ProjectItem(this.element.querySelector('ul')!.id, projectItem);
        }
    }
}

// project input Class
class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
    titleInputElement: HTMLInputElement;
    descriptionInputElement: HTMLInputElement;
    peopleInputElement: HTMLInputElement;

    constructor(){
        super('project-input', 'app', true, 'user-input');
        this.titleInputElement = <HTMLInputElement> this.element.querySelector('#title');
        this.descriptionInputElement = <HTMLInputElement> this.element.querySelector('#description');
        this.peopleInputElement = <HTMLInputElement> this.element.querySelector('#people');

        this.configure();
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
            projectState.addProject(title, desc, people);
            this.clearInputs();
        }
    }

    configure(){
        this.element.addEventListener("submit", this.submitHandler);
    }

    renderContent(){}
}

const pojectInput = new ProjectInput();
const activeProjectList = new ProjectList("active");
const finishedProjectList = new ProjectList("finished");

