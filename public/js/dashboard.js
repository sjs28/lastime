//Declarations
let currentPage = "tasks";
let pages = ["tasks"];
let users = ["Oops!"];
let taskSchema = [];
//Populate users dropdowns
fetch('../api/users').then((response) => response.json())
    .then((json) => {
        users = json;
        initSchemas();
    })
populateTasks();
$('#nav-tasks').addClass('active').siblings().removeClass('active');
$('#tasksearch').on('input', populateTasks)

//#region modal back control
function handleBackPress(event) {
    event.preventDefault();
    event.stopPropagation();

    $('.modal').modal('hide');
    $('.modal-backdrop').remove();
}

var closedModalHashStateId = "#modalClosed";
var openModalHashStateId = "#modalOpen";

window.location.hash = closedModalHashStateId;

$(window).on('popstate', this.handleBackPress);
document.addEventListener("backbutton", this.handleBackPress, false);
//#endregion

//#region **** Nav ****
//Nav listeners
for (let i = 0; i < pages.length; i++) {
    if (i != 0) {
        $('#container-' + pages[i]).hide();
    }
    document.getElementById("nav-" + pages[i]).addEventListener("click", go);
}

//Swipe Listeners
document.getElementById('body').addEventListener('touchstart', touchstart);
document.getElementById('body').addEventListener('touchend', touchend);

//Nav handlers
/**
 * 
 * @param {event} evt - JS event
 * @param {string} pagename - Name of a subpage to switch to
 */
function go(evt, pagename) {
    let page = evt ? evt.currentTarget.id.split('nav-')[1] : pagename;
    //hide everythign else
    for (let i = 0; i < pages.length; i++) {
        if (pages[i] != page) {
            $("#container-" + pages[i]).hide();
        }
    }

    //show this page
    $("#container-" + page).show();
    currentPage = page;

    //trigger population
    populate(page);
}

//Navbar active controller
$('[id^=nav-]').click(function () {
    $(this).addClass('active').siblings().removeClass('active');
});

//Swipe Handlers
let startx, starty, endx, endy;
function touchstart(event) {
    startx = event.touches[0].clientX;
    starty = event.touches[0].clientY;
}
function touchend(event) {
    endx = event.changedTouches[0].clientX;
    endy = event.changedTouches[0].clientY;

    if (endx < startx - 75 && (endy < starty + 50 && endy > starty - 50)) {
        swipeNav('left');
    } else if (endx > startx + 75 && (endy < starty + 50 && endy > starty - 50)) {
        swipeNav('right');
    }
}
function swipeNav(direction) {
    if (pages.length === 1) {
        return;
    }
    console.log(direction);
    let increment = 0;
    switch (direction) {
        case 'right':
            increment = -1;
            break;
        case 'left':
            increment = 1;
            break;
    }
    let currentIndex = pages.indexOf(currentPage);
    let newPageIndex = 0;
    if (currentIndex == 0) {
        newPageIndex = direction == 'left' ? 1 : pages.length - 1;
    } else if (currentIndex == pages.length - 1) {
        newPageIndex = direction == 'left' ? 0 : pages.length - 2;
    } else {
        newPageIndex = currentIndex + increment;
    }

    go(null, pages[newPageIndex])


    $('#nav-' + pages[newPageIndex]).addClass('active').siblings().removeClass('active');
}
//#endregion

//#region **** Buttons ****
$('#addTask').on('click', addTaskListener);


function addTaskListener() {
    $.modal('addItem', {
        task: {},
        schema: taskSchema,
        type: 'task',
        title: "Add New Task",
        actions: ["Cancel", "Save"],
        handler: function (data) {
            if (data != null) {
                fetch('../api/tasks/create', {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ task: data.item })
                })
                    .then(() => populateTasks());
            }

        }
    });
}
//#endregion

//#region **** Population ****
/**
 * Triggers content population for a given page
 * @param {string} page - The name of the page to populate
 */
function populate(page) {
    switch (page) {
        case 'tasks':
            populateTasks();
            break;
    }
}


function populateTasks() {
    let search = $('#tasksearch').val();
    if (search.length < 3) {
        search = "";
    }
    fetch('../api/tasks' + (search ? '?search=' + search : ''))
        .then(response => { return response.json() })
        .then(result => {
            //Populate the page
            let $tasks = $('#tasks');
            $tasks.empty();
            result ? result.forEach(function (task) {
                let lastDone = getDueDisplay(task.lastDone);
                let $t = $(`<div id="${task._id}" class="card">
                                <div class="content">
                                    <div class="header">
                                        ${task.title}
                                    </div>
                                </div>
                                <div class="extra content">
                                    <div class="right floated meta">
                                        ${task.doneBy ?? ' '}
                                    </div>
                                    <div class="meta">
                                        ${lastDone.text}
                                    </div>
                                </div>
                            </div>`);

                $t.data('task', task);

                $t.on('click', function (e) {
                    e.stopPropagation();
                    let task = $('#' + $($(e.target).parents('.card')[0]).attr('id')).data('task');
                    $.modal('addItem', {
                        schema: taskSchema,
                        type: 'task',
                        item: task,
                        readOnly: true,
                        actions: ["Done It", "Archive", "Edit"],
                        handler: function (result) {
                            if (result && !result.edit) {
                                updateTask(result);
                            } else if (result && result.edit) {
                                //Pop up a prompt for the user to set owner
                                $.modal('addItem', {
                                    schema: taskSchema,
                                    type: 'task',
                                    item: task,
                                    readOnly: false,
                                    actions: ["Save", "Cancel"],
                                    handler: function (result) {
                                        if (result) {
                                            updateTask(result);
                                        }
                                    }
                                });
                            }
                        }
                    });
                })

                $tasks.append($t);
            }) : null;
        })
}



function getDueDisplay(due) {
    let response = { "text": "", "class": "" };
    let dt = new Date(due);
    if (dt == "Invalid Date") {
        response.text = "Never done";
    } else {
        let now = new Date();
        let today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (dt < today) {
            response.class = "red basic";
        }

        if (dt == addDays(now, -1)) {
            response.text = "Yesterday";
        } else if (dt == addDays(now, 1)) {
            response.text = "Tomorrow";
        } else {
            response.text = dt.toDateString();
        }
    }

    return response;
}

/**
 * Add days to a date object
 * @param {Date} dateObj - The date object to add days to
 * @param {number} days - The number of days to add
 * @returns 
 */
function addDays(dateObj, days) {
    const d = new Date(dateObj.getTime());
    d.setDate(d.getDate() + days);
    return d;
}
//#endregion


function updateTask(data) {
    fetch('../api/tasks/update', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
        .then(() => populateTasks());
}



//////Modals
$.fn.modal.settings.templates.addItem = function (input) {
    let content = '';
    let schema = input.schema;
    let hasData = input.hasOwnProperty("item");

    window.history.pushState('forward', null, './' + openModalHashStateId);

    let submitFn = function () {
        let data = {};
        for (let i = 0; i < schema.length; i++) {
            if (schema[i].type == 'list') {
                data[schema[i].name] = $('#itemmodal_' + schema[i].name).find(':selected').val();
            } else if (schema[i].type == 'bool') {
                data[schema[i].name] = $('#itemmodal_' + schema[i].name).is(':checked');
            } else {
                data[schema[i].name] = $('#itemmodal_' + schema[i].name).val();
            }

            if (!data[schema[i].name] && !schema[i].optional && !schema[i].hideOnEdit) {
                //Add some nice way to show it in the UI before rejecting. Maybe toast?
                return false;
            }
        }
        input.handler({ complete: false, id: hasData ? input.item._id : false, edit: hasData, item: data });
        window.history.back();
    };

    let completeFn = function () {
        input.handler({ complete: true, id: input.item._id });
        window.history.back();
    }

    let archiveFn = function () {
        input.handler({ complete: false, id: input.item._id, archive: true });
        window.history.back();
    }

    let editFn = function () {
        input.handler({ complete: false, id: input.item._id, edit: true });
        window.history.back();
    }

    let cancelFn = function () {
        input.handler(null);
        window.history.back();
    };

    for (let i = 0; i < schema.length; i++) {
        if (hasData && schema[i].hideOnEdit) {
            continue;
        }
        if (schema[i].readOnly && !hasData) {
            //Creating new shouldn't show random readonlys as they're empty
            continue;
        }
        let visField, visVal;
        try {
            visField = Object.keys(schema[i].visibility)[0];
            visVal = schema[i].visibility[visField];
        } catch { }
        content += `<div class="ui labeled ${input.readOnly || schema[i].readOnly ? 'disabled' : ''} input ${schema[i].initialHide && (!input.item || (input.item && input.item[visField] != visVal)) ? 'hidden' : ''}">`
        content += `<div class="ui blue label" style="width:100px">${schema[i].display}</div>`
        if (schema[i].type == 'list') {
            content += `<select id="itemmodal_${schema[i].name}" class="ui selection ${input.readOnly ? 'disabled' : ''} dropdown" ${schema[i].onEdit ? 'onChange="dropdownOnEdit(\'itemmodal_' + schema[i].name + '\',\'' + input.type + '\')"' : ''}>`
            content += `<option disabled selected value> </option>`;
            for (let j = 0; j < schema[i].options.length; j++) {
                let opt = schema[i].options[j];
                content += `<option value="${opt}" ${hasData ? input.item[schema[i].name] == opt ? 'selected' : '' : ''}>${opt}</option>`;
            }

            content += `</select>`;
        }
        else if (schema[i].type == 'bool') {
            let checked = hasData ? input.item[schema[i].name] : false;
            content += `<div class="ui fitted toggle ${checked ? 'checked' : ''} ${input.readOnly || schema[i].readOnly ? 'disabled' : ''} checkbox"><input id="itemmodal_${schema[i].name}" type="checkbox" ${checked ? 'checked=""' : ''} ${input.readOnly || schema[i].readOnly ? 'disabled="disabled"' : ''}><label></label></div>`
        } else {
            content += `<input id="itemmodal_${schema[i].name}" type="${schema[i].type}" placeholder="${schema[i].placeholder}" value="${hasData ? input.item[schema[i].name] : ""}">`
        }
        content += '</div>'
    }

    let actions = [
        {
            text: 'Cancel',
            class: 'negative',
            click: cancelFn,
        },
        {
            text: 'Save',
            class: 'green',
            click: submitFn,
        },
        {
            text: "Edit",
            class: 'blue',
            click: editFn
        },
        {
            text: "Archive",
            class: 'orange',
            click: archiveFn
        },
        {
            text: "Done It",
            class: 'green',
            click: completeFn
        }
    ];

    return {
        title: input.title,
        centered: false,
        content: content,
        contentClass: 'black',
        onApprove: submitFn,
        onDeny: cancelFn,
        actions: actions.filter(x => input.actions.indexOf(x.text) > -1)
    };
}


function initSchemas() {
    taskSchema = [
        {
            "name": "title",
            "display": "Title",
            "type": "text",
            "placeholder": ''
        },
        {
            "name": "description",
            "display": "Description",
            "type": "text",
            "placeholder": '',
            "optional": true
        },
        {
            "name": "lastDone",
            "display": "Last Done",
            "type": "text",
            "optional": true,
            "initialHide": true
        }
    ];
}


function dropdownOnEdit(id, type) {
    let schema = [];
    switch (type) {
        case 'task':
            schema = taskSchema;
            break;
    }

    let onEdit = schema.filter(x => x.name == id.replace('itemmodal_', ''))[0].onEdit;
    let val = $('#' + id).find(':selected').val();
    let keys = Object.keys(onEdit);
    keys.forEach(function (option) {
        if (option == val) {
            $('#itemmodal_' + onEdit[option]).parents('.ui.labeled.input').removeClass('hidden');
        } else {
            $('#itemmodal_' + onEdit[option]).parents('.ui.labeled.input').addClass('hidden');
        }
    })
}