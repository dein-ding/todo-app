// ***********************************************
// This example namespace declaration will help
// with Intellisense and code completion in your
// IDE or Text Editor.
// ***********************************************
declare namespace Cypress {
    interface Chainable<Subject = any> {
        // customCommand(param: any): typeof customCommand;
        getByPlaceholder: typeof getByPlaceholder;
        withinModal: typeof withinModal;
    }
}

Cypress.Commands.add('getByPlaceholder', getByPlaceholder);
function getByPlaceholder(placeholder: string) {
    return cy.get(`input[placeholder="${placeholder}"]`);
}

Cypress.Commands.add('withinModal', withinModal);
function withinModal(cb: Parameters<Cypress.ChainableMethods['within']>[1]) {
    cy.get('.modal-body').within({}, cb);
}

//
// function customCommand(param: any): void {
//   console.warn(param);
// }
//
// NOTE: You can use it like so:
// Cypress.Commands.add('customCommand', customCommand);
//
// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })
