const nameInput = document.querySelector("#nameInput");
const outputList = document.querySelector(".output ul");
const listTitle = document.querySelector(".heading");

class Task {
    constructor(name) {
        this.name = name;
        this.id = TODO.sub.generateId();
    }
    priority = 0;
    isCompleted = false;
    timeCompleted = null;
    metaData = {
        links: [],
        notes: "",
    };
    collapseSubtaskList = false;
    subTasks = [];
}
class List {
    constructor(name = "ToDo") {
        this.name = name;
        this.id = TODO.sub.generateId();
    }
    metaData = {
        notes: "",
    };
    list = [];
}
const TODO = {
    task: {
        getById(taskId, taskList, args = {}) {
            const defaults = {
                parent: false,
                log: true,
            };
            const { parent, log } = { ...defaults, ...args };

            if (log)
                console.log(
                    `%cSearching for ${parent ? "parent array with " : ""}task %cID: ` + taskId,
                    "color: hsl(290, 100%, 50%); font-size: 14px;",
                    "color: hsl(204, 100%, 50%); font-size: 14px;"
                );
            let levelsDeep = -1;
            recurse = (taskId, arr) => {
                levelsDeep++;

                if (log) console.group(`%csearching tasks [${levelsDeep} levels deep]...`, "color: orange");
                if (log) console.log(arr);
                for (let i in arr) {
                    const task = arr[i];

                    if (task.id == taskId) {
                        const result = parent ? arr : task;
                        if (log)
                            console.group(
                                `%c${task.name} %c-> %cid match [${levelsDeep} levels deep] =>`,
                                "color: hsl(204, 100%, 50%);",
                                "",
                                "color: hsl(113, 100%, 47%)"
                            );
                        if (parent && log)
                            console.log(
                                `%c${task.name} -> parent task array =>`,
                                "color: hsl(113, 100%, 47%); font-weight: 700;"
                            );
                        if (log) console.log(result);
                        if (log) console.groupEnd();

                        if (log) for (let i = 0; i < levelsDeep + 5; i++) console.groupEnd();
                        return result;
                    } else {
                        // if (log) console.groupEnd();
                        if (log)
                            console.group(
                                `%c${task.name} %c-> %c[${task.id}] no match;`,
                                "color: hsl(204, 100%, 50%);",
                                "",
                                "color: red"
                            );
                        if (task.subTasks.length != 0) {
                            if (log) console.log("%c" + task.name + " -> subTasks =>", "color: orange");
                            const taskRef = recurse(taskId, task.subTasks);
                            if (log) console.groupEnd();

                            if (taskRef) return taskRef;
                            else levelsDeep--;
                        } else {
                            if (log)
                                console.log(
                                    "%c" + task.name + " %c-> %cno subTasks;",
                                    "color: hsl(204, 100%, 50%);",
                                    "",
                                    "color: red;"
                                );
                            if (log) console.groupEnd();
                            // levelsDeep--;
                        }
                    }
                }
                if (log) console.groupEnd();
            };
            return recurse(taskId, taskList);
        },
        getById_Slim(taskId, taskList, parent = false) {
            recurse = (taskId, arr) => {
                for (let i in arr) {
                    const task = arr[i];

                    if (task.id == taskId) return parent ? arr : task;
                    else if (task.subTasks.length != 0) {
                        const taskRef = recurse(taskId, task.subTasks);
                        if (taskRef) return taskRef;
                    }
                }
            };
            return recurse(taskId, taskList);
        },
        add() {
            if (!nameInput.value) return;
            if (TODO.data.lists.length == 0) alert("You don't have any lists.");

            TODO.taskLists.active.list.push(new Task(nameInput.value));
            TODO.taskLists.displayList();
            TODO.taskLists.displayListsInSidebar();

            clearForm();
        },
        addSubTask(id) {
            const taskName = prompt("sub task name");
            if (!taskName) return;

            TODO.task.getById_Slim(id, TODO.taskLists.active.list).subTasks.push(new Task(taskName));
            TODO.taskLists.displayList();
        },
        subtaskList: {
            toggle(taskId, dropdownToggleElem) {
                const task = TODO.task.getById_Slim(taskId, TODO.taskLists.active.list);

                if (!("collapseSubtaskList" in task)) task.collapseSubtaskList = false;
                task.collapseSubtaskList = !task.collapseSubtaskList;
                TODO.db.save();

                document.querySelector(`.subtask-list-${taskId}`).classList.toggle("hide");
                dropdownToggleElem.classList.toggle("open");
            },
        },
        /**
         * @param {number} id
         * @param {boolean} isCompleted wether the task should be marked as completed or not
         */
        setCompleted(id, isCompleted = true) {
            const task = TODO.task.getById_Slim(id, TODO.taskLists.active.list);
            task.isCompleted = isCompleted;
            task.timeCompleted = isCompleted ? new Date() : null;

            // TODO.task.migrate(task, "metaData", {
            //     links: [],
            //     notes: "",
            // });

            TODO.taskLists.displayList();
            TODO.taskLists.displayListsInSidebar();
        },
        edit(id) {
            const task = TODO.task.getById_Slim(id, TODO.taskLists.active.list);
            const args = {
                name: task.name,
                priority: task.priority || 0,
                metaData: task.metaData,
            };

            TODO.editMenu
                .display(args)
                .then(res => {
                    task.name = res.name;
                    task.priority = parseInt(res.priority);
                    task.metaData = res.metaData;

                    TODO.taskLists.displayList();
                })
                .catch(err => {
                    if (err == "delete") TODO.task.remove(id, false);
                });
        },
        remove(id, prompt = true) {
            const parentArr = TODO.task.getById_Slim(id, TODO.taskLists.active.list, { parent: true });
            const task = TODO.task.getById_Slim(id, TODO.taskLists.active.list);
            const indexOfTaskInParentArr = parentArr.indexOf(task);

            if (prompt) if (!confirm("Delete this task?")) return; // TODO: make this an inline animation
            parentArr.splice(indexOfTaskInParentArr, 1);

            TODO.taskLists.displayList();
            TODO.taskLists.displayListsInSidebar();
        },
        migrate(task, key, defaultValue) {
            if (!task[key]) task[key] = defaultValue;
            console.log(key + " set to " + defaultValue);
        },
        migrateAll(arr, key, defaultValue, overwrite = false) {
            recurse = arr => {
                arr.forEach(item => {
                    if (!item[key] || overwrite) item[key] = defaultValue;
                    console.log(key + " set to " + JSON.stringify(defaultValue, null, 4));

                    // recurse(item.subTasks);
                });
            };
            recurse(arr);
            // TODO.db.save();
        },
    },
    editMenu: {
        isOpen: false,
        animate(state, additionalClass) {
            const menuContainer = document.querySelector(".edit-menu-container");
            if (state) {
                menuContainer.classList.add("show", `${additionalClass}-edit`);
            } else {
                menuContainer.classList.remove("show");
                setTimeout(() => menuContainer.classList.remove(`${additionalClass}-edit`), 500);
            }
        },
        /**
         * @param {{ name, priority, whatToEdit }} defaultValues
         * @returns {Promise<object | string>}
         */
        display({ name, priority, metaData, whatToEdit = "task" }) {
            const nameInput = document.querySelector(".edit-menu .nameInput");
            const prioritySlider = document.querySelector("#prioritySlider");
            const notesTextarea = document.querySelector("#notesTextarea");
            const linkInput = document.querySelector("#linkInput");
            const linkList = document.querySelector(".link-list ul");

            TODO.editMenu.isOpen = true;
            TODO.editMenu.animate(true, whatToEdit);
            nameInput.value = name;
            nameInput.placeholder = `${whatToEdit == "task" ? "task" : "list"} name`;
            nameInput.select();

            notesTextarea.value = metaData.notes;

            TODO.editMenu.linkList = {
                display: () => {
                    linkList.innerHTML = metaData.links
                        .filter(link => link != "")
                        .map(link =>`
                            <li>
                                <a href="${link}">${link}</a>&nbsp;
                                <i
                                    onclick="TODO.editMenu.linkList.remove('${link}')"
                                    class="far fa-trash-alt"
                                    style="color: var(--danger-clr); cursor: pointer;"
                                ></i>
                            </li>`
                        ).join("\n"); //prettier-ignore
                },
                add() {
                    if (!linkInput.value) return;

                    metaData.links.push(linkInput.value);
                    linkInput.value = "";
                    TODO.editMenu.linkList.display();
                },
                edit(link) {
                    const index = metaData.links.indexOf(link);
                    const updatedLink = prompt("edit link", link);

                    if (updatedLink) metaData.links[index] = updatedLink;
                },
                remove(link) {
                    const index = metaData.links.indexOf(link);
                    metaData.links.splice(index, 1);
                    TODO.editMenu.linkList.display();
                },
            };

            if (whatToEdit == "task") {
                prioritySlider.value = priority;
                TODO.editMenu.linkList.display();
            }

            return new Promise((resolve, reject) => {
                TODO.editMenu.buttonPressed = res => {
                    switch (res) {
                        case "done":
                            TODO.editMenu.linkList.add();
                            metaData.notes = notesTextarea.value;
                            const updatedValues = {
                                name: nameInput.value,
                                priority: prioritySlider.value,
                                metaData,
                            };
                            resolve(updatedValues);
                            break;
                        case "delete":
                            if (confirm(`Are you sure you want to delete this ${whatToEdit == "task" ? "task" : "list"}?`))
                                reject("delete");
                            break;
                        case "closed":
                            reject("closed");
                            break;
                    }
                    TODO.editMenu.animate(false, whatToEdit);
                    TODO.editMenu.isOpen = false;
                };
                document.addEventListener("keydown", e => e.key == "Enter" && !e.shiftKey ? TODO.editMenu.buttonPressed("done") : {}); //prettier-ignore
                document.addEventListener("keydown", e => e.key == "Escape" ? TODO.editMenu.buttonPressed("closed") : {}); //prettier-ignore
            });
        },
    },
    taskLists: {
        active: null,
        getListById: listId => TODO.data.lists.filter(listObj => listObj.id == listId)[0],
        getActiveList() {
            const activeList = TODO.taskLists.getListById(TODO.data.activeListId);
            // console.log(activeList.name);
            // console.log(activeList);
            return activeList;
        },
        setActiveList(listId) {
            if (listId == null) {
                TODO.data.activeListId = null;
                TODO.taskLists.displayList(null);
                TODO.taskLists.displayListsInSidebar();
                return;
            }

            TODO.data.activeListId = listId;
            TODO.taskLists.active = TODO.taskLists.getActiveList();

            TODO.taskLists.displayList();
            TODO.taskLists.displayListsInSidebar();
        },
        createList(newListName) {
            newListName = newListName || prompt("new list name");
            if (!newListName) return;
            const newList = new List(newListName);
            TODO.data.lists.push(newList);
            TODO.taskLists.setActiveList(newList.id);
            TODO.taskLists.displayListsInSidebar();
        },
        editList(listId) {
            const list = TODO.taskLists.getListById(listId);

            const args = {
                name: list.name,
                whatToEdit: "list",
                metaData: list.metaData,
            };
            TODO.editMenu
                .display(args)
                .then(res => {
                    list.name = res.name;
                    list.metaData = res.metaData;
                    TODO.taskLists.displayList();
                    TODO.taskLists.displayListsInSidebar();
                })
                .catch(err => {
                    if (err == "delete") TODO.taskLists.deleteList(listId);
                });
        },
        sortListBy: (arr, sortBy) => {
            switch (sortBy) {
                case "completion":
                    return arr.sort((a, b) => a.isCompleted - b.isCompleted); //-> uncompleted first
                case "priority":
                    console.warn("sorting by priority is not set up yet");
                    break;
            }
        },
        deleteList(listId) {
            const taskList = TODO.taskLists.getListById(listId);
            const index = TODO.data.lists.indexOf(taskList);
            TODO.data.lists.splice(index, 1);

            if (TODO.data.lists.length > 0) {
                const lastIndex = TODO.data.lists.length - 1;
                TODO.taskLists.setActiveList(TODO.data.lists[lastIndex].id);
            } else TODO.taskLists.setActiveList(null);
        },
        getListHtmlString: (taskList = TODO.taskLists.active.list) =>
            taskList.map((task, i) => TODO.taskLists.getTaskString(task, i)).join("\n"),
        getTaskString: (task, i) => `
            <li id="task-${task.id}" class="task ${task.isCompleted ? 'completed' : ''}">
                <button 
                    class="btn btn-icon btn-complete"
                    onclick="TODO.task.setCompleted('${task.id}', ${!task.isCompleted})"
                ><i class="fa${task.isCompleted ? 's' : 'r'} fa-check-circle"></i
                ></button>
                <div class="text-container">
                    <p class="cell_">
                        <span class="taskName"><span style="color: var(--danger-clr);">
                            ${TODO.sub.multiplyText("! ", task.priority || 0)}</span>${TODO.XSSenabled ? task.name : escapeHTML(task.name)}
                        </span>
                        ${task.metaData.links.filter(link => link !== "").map(link => `<a class="external-link" href="${link}" title="${link}" target="_blank"><i class="fas fa-external-link"></i></a>`).join(' ') || ""}
                        ${task.isCompleted && task.timeCompleted
                            ? `- <span style="color: var(--complete-clr);">${TODO.sub.formatTime(task.timeCompleted)}</span>`
                            : ''
                        }
                    </p>
                    ${ task.subTasks.length != 0 ? `
                        <p class="dropdown-toggle ${task.collapseSubtaskList ? "" : "open"}" onclick="TODO.task.subtaskList.toggle('${task.id}', this)">
                            <i class="fas fa-chevron-down"></i> ${task.subTasks.length} subtask${task.subTasks.length == 1 ? "" : 's'}
                        </p>
                    ` : ""}
                </div>
                <div class="btn-group">
                    <button
                        title="add sub task"
                        class="btn btn-icon btn-add-subTask"
                        ${task.isCompleted ? 'disabled' : ''}
                        onclick="TODO.task.addSubTask('${task.id}')"
                        style="--btn-index: 2; --btn-index-reverse: 0;"
                    ><i class="fas fa-plus"></i
                    ></button
                    ><button
                        title="edit task"
                        class="btn btn-icon btn-edit"
                        ${task.isCompleted ? 'disabled' : ''} 
                        onclick="TODO.task.edit('${task.id}')"
                        style="--btn-index: 1; --btn-index-reverse: 1;"
                    ><i class="fas fa-pencil-alt"></i
                    ></button
                    ><button
                        title="delete task"
                        class="btn btn-icon btn-delete"
                        onclick="TODO.task.remove('${task.id}')"
                        style="--btn-index: 0; --btn-index-reverse: 2;"
                    ><i class="far fa-trash-alt"></i
                    ></button>
                </div>
            </li>
            ${task.subTasks.length != 0
                ? `<ul class="subtask-list subtask-list-${task.id} ${task.collapseSubtaskList ? "hide" : ""}">${TODO.taskLists.getListHtmlString(task.subTasks)}</ul>`
                : ""}
        `, //prettier-ignore
        displayList: (taskList = TODO.taskLists.active.list) => {
            // TODO.task.migrateAll( taskList, "metaData", {
            //     links: [""],
            //     notes: "",
            // }, true); //prettier-ignore

            // console.group(TODO.taskLists.active.name);
            // console.log(TODO.taskLists.active.list.map(item => item.name).join("\n"));
            // console.groupEnd();

            TODO.db.save();

            if (taskList == null) {
                listTitle.innerHTML = "no list selected";
                outputList.innerHTML = '<h5 style="text-align:center;">No Tasks yet...</h5>';
                return;
            }

            //display list name
            listTitle.innerHTML = `
                ${TODO.taskLists.active.name}
                <i class="fas fa-pencil-alt btn btn-primary btn-icon"
                    style="cursor:pointer; padding: unset; position: relative; top: -3px;"
                    onclick="TODO.taskLists.editList('${TODO.taskLists.active.id}')">
                </i>
            `;

            if (taskList.length == 0) {
                outputList.innerHTML = '<h5 style="text-align:center;">No tasks yet...</h5>';
                return;
            } else {
                TODO.taskLists.sortListBy(taskList, "completion");
                outputList.innerHTML = TODO.taskLists.getListHtmlString(taskList);
            }

            //alternate the background
            document.querySelectorAll(".task").forEach((taskElement, i) => {
                if (i % 2 === 1) taskElement.style.background = "var(--alt-bg)";
            });
        },
        displayListsInSidebar() {
            const taskListsList = document.querySelector("#taskListsList");

            if (TODO.data.lists.length == 0) {
                taskListsList.innerHTML = '<h5 style="text-align:center;">No lists...</h5>';
                return;
            }

            const activeListId = TODO.data.activeListId;
            taskListsList.innerHTML = TODO.data.lists
                .map(list =>
                    `<li onclick="TODO.taskLists.setActiveList('${list.id}')" ${
                        activeListId == list.id ? 'class="active"' : ""
                    }>${list.name} <span style="color: var(--danger-clr); opacity: .7;">${
                        list.list.filter(task => !task.isCompleted).length || ""
                    }</span> <i class="fas fa-chevron-right"></i></li>`
                ).join("\n"); //prettier-ignore
        },
    },
    XSSenabled: false,
    toggleXSSEnabled(state) {
        if (state) TODO.XSSenabled = false;
        else if (state === false) TODO.XSSenabled = true;
        else TODO.XSSenabled = !TODO.XSSenabled;

        TODO.taskLists.displayList();
        TODO.taskLists.displayListsInSidebar();
    },
    db: {
        localStorageKey: "todoListData",
        getDefaultData: () => {
            const newList = new List();
            return {
                activeListId: newList.id,
                lists: [newList],
            };
        },
        save: () => (localStorage[TODO.db.localStorageKey] = JSON.stringify(TODO.data)),
        exportJson: () => downloadObjectAsJson(TODO.data, "ToDo-data", true),
        load: () => {
            try {
                TODO.data = JSON.parse(localStorage[TODO.db.localStorageKey]);
            } catch (err) {
                TODO.data = TODO.db.getDefaultData();
            }
            TODO.taskLists.active = TODO.taskLists.getActiveList();
        },
        importJson: async () => {
            try {
                const jsonData = JSON.parse(await document.querySelector("#importDataInput").files[0].text());
                console.log(jsonData);

                if ("activeListId" in jsonData && "lists" in jsonData) {
                    TODO.data.lists = [...TODO.data.lists, ...jsonData.lists];
                    TODO.taskLists.displayList();
                    TODO.taskLists.displayListsInSidebar();
                } else alert("The JSON File does not contain the necessary data.");
            } catch (e) {
                alert("Failed to parse JSON file. Have you modified it?");
                console.error("Failed to parse JSON: " + e);
            }
        },
        delete: () => localStorage.removeItem(TODO.db.localStorageKey),
    },
    load() {
        TODO.db.load();
        TODO.taskLists.displayList();
        TODO.taskLists.displayListsInSidebar();
    },
    sub: {
        generateId: () => (Date.now() + Math.random()).toString().replace(".", "_"),
        formatTime: time =>
            `${new Date(time).toLocaleString("de-DE", { weekday: "long", day: "numeric", month: "short" })}
            ${new Date(time).toLocaleString("de-DE", { timeStyle: "short" })}`, //prettier-ignore
        multiplyText(text = "!", multiplier = 3) {
            let result = "";
            for (i = 0; i < multiplier; i++) result += text;
            return result;
        },
    },
};

/**
 * @param {boolean} blur wether or not to blur the input field
 */
const clearForm = (blur = false) => {
    nameInput.value = "";
    if (blur) nameInput.blur();
};

// add keybindings
nameInput.addEventListener("keydown", e => (e.key == "Enter" ? TODO.task.add() : {}));
nameInput.addEventListener("keydown", e => (e.key == "Escape" ? clearForm(true) : {}));

/**
 * ## download JSON object or array as file
 * @param {object | array} exportObj
 * @param {string} fileName -> **without the file extension**
 */
function downloadObjectAsJson(exportObj, fileName, readable) {
    const dataString =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(readable ? JSON.stringify(exportObj, null, 4) : JSON.stringify(exportObj));
    console.log("char length: " + dataString.length);
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.href = dataString;
    downloadAnchorNode.download = fileName + ".json";
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

escapeHTML = (unsafe) =>
	unsafe == "" || unsafe == null
		? ""
		: unsafe.replace(/[&<"']/g, (match) => {
				switch (match) {
					case "&":
						return "&amp;";
					case "<":
						return "&lt;";
					case '"':
						return "&quot;";
					case "'":
						return "&apos;";
					default:
						return match;
				}
        }); //prettier-ignore

TODO.load();
