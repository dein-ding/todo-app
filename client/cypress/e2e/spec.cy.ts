// @TODO: add attributes to elements to not select them by things that subject to change

describe('Fundamentals', () => {
    it('Visits the the app', () => {
        cy.visit('/');
        cy.contains('Lists');
    });

    describe('Tasks', () => {
        const newTaskName = 'my first task';
        it('Can create', () => {
            cy.getByPlaceholder('What shall it be?').first().focus().type(newTaskName);
            cy.contains('add').click();
        });

        const secondNewTaskName = 'my second task';
        it('Can create in the secondary input', () => {
            const input = cy.getByPlaceholder('add new task...').first();
            input.focus().type(secondNewTaskName);
            input.siblings().contains('add').click();
        });

        it('Can rename', () => {
            cy.contains(newTaskName).click().type(' - with edits...').type('{esc}');
            cy.contains(newTaskName);

            cy.contains(secondNewTaskName)
                .click()
                .type('{selectAll}')
                .type('{backspace}')
                .type('the edited title')
                .type('{enter}');
            cy.document().its('body').should('not.contain', secondNewTaskName);
        });

        it.skip('[fucks everything up at the moment] Can complete', () => {
            cy.contains(newTaskName).parent().parent().parent().within(() => {
                cy.get('button').click()
                // cy.get('#task-1656775446055_8713 > .outer-wrapper > .wrapper > .text-container > .wrap-text > .taskName')
                cy.wait(3000)
            })
        });
        
        it.skip('Can uncomplete', () => {});
        it.skip('Can delete', () => {});
        
        describe('Subtasks', () => {
            it.skip('Can create', () => {});
            it.skip('Can complete', () => {});
            it.skip('Can uncomplete', () => {});
            it.skip('Can delete', () => {});
        });
    });
    
    const newListName = 'new list';
    describe('Lists', () => {
        it('Can create', () => {
            cy.contains('Lists').within(() => {
                cy.get('button').last({ log: true }).click();
            });
            
            cy.withinModal(() => {
                cy.contains('Create new list');
                cy.getByPlaceholder('list name').focus().type(newListName);
                
                cy.get('.btn-group').within((subject) => {
                    cy.contains('Create').click();
                });
            });
            cy.contains(newListName);
            // cy.document().its('body').should('contain', newListName);
        });

        it.skip('Can delete', () => {
            cy.get('.list-name').within(() => {
                cy.contains(newListName);
                cy.get('button').first().click();
            });

            cy.withinModal(() => {
                cy.contains('TaskList details');
                cy.contains('delete').click();
            });
            cy.withinModal(() => {
                cy.get('.btn-group').contains('Delete').click();
            });
        });

        it.skip('Can export');
        it.skip('Can import');
        it.skip('Can switch between lists');
    });
});
