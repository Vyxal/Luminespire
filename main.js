// hashmap of all lines and indexes of characters in the program

let lines = new Map();
let selectedLine = -1;
let lineCount = 1

function refreshTable() {

    let table = document.getElementById("cells");

    let tableHtml = "<tr>";
    let program = document.getElementById("program").value.split("");

    program.forEach((char, index) => {
        const highlightAddition = lines.get(`line${selectedLine}`)?.includes(index) ? "style='background-color: yellow'" : "";
        tableHtml += `<td onclick="handle(${index})" ${highlightAddition}>${char}</td>`
    }
    );

    tableHtml += "</tr>";
    table.innerHTML = tableHtml;
}

function handle(index) {
    if (selectedLine == -1) { return }
    let line = lines.get(`line${selectedLine}`);
    if (line.includes(index)) {
        line.splice(line.indexOf(index), 1);

        // Also highlight the character in the program

        let table = document.getElementById("cells");
        let row = table.rows[0];
        row.cells[index].style.backgroundColor = "white";

    } else {
        line.push(index);
        line.sort((a, b) => a - b)

        // Also dehighlight the character in the program
        let table = document.getElementById("cells");
        let row = table.rows[0];
        row.cells[index].style.backgroundColor = "yellow";
    }
    lines.set(`line${selectedLine}`, line);

    let element = document.getElementById(`line${selectedLine}`);
    let code = line.map((index) => document.getElementById("program").value[index]).join("");
    element.children[0].rows[0].cells[2].innerHTML = "{" + code + "}";

}

function updateSelect(id) {
    selectedLine = id;
    refreshTable();
}

function addLine() {
    // Dynamically add a row to the "lines" table
    let table = document.createElement("table");
    let row = table.insertRow(-1);
    let cellSelect = row.insertCell(0);
    let cellName = row.insertCell(1);
    let cellCode = row.insertCell(2);
    let cellInput = row.insertCell(3);
    let cellRemove = row.insertCell(4);
    let cellEmpty = row.insertCell(5);
    let id = lineCount
    cellSelect.innerHTML = `<input type="radio" name="line" onclick="updateSelect(${id})" value="line${id}">`;
    cellName.innerHTML = `Line ${id}`;
    cellCode.innerHTML = "{}";
    cellInput.innerHTML = `<textarea id="line${id}"></textarea>`;
    cellRemove.innerHTML = `<button onclick="removeLineX(${id - 1})">Remove</button>`;
    cellEmpty.innerHTML = `<button onclick=clearLine(${id})>Clear</button>`;

    // Add the line to the hashmap
    lines.set(`line${id}`, []);

    let sections = document.getElementById("sections");
    let newLine = document.createElement("li");
    newLine.appendChild(table);
    newLine.setAttribute("id", `line${id}`);
    sections.appendChild(newLine);

    lineCount++;

}

function removeLine() {
    // Remove the last li from the "sections" ul
    let element = document.getElementById(`line${lineCount - 1}`);
    element.parentNode.removeChild(element);
    lines.delete(`line${lineCount - 1}`);
    lineCount--;
}

function removeLineX(x) {
    // Remove the nth li from the "sections" ul
    let element = document.getElementById(`line${x + 1}`);
    element.parentNode.removeChild(element);
    lines.delete(`line${x + 1}`);

    lineCount--;

    // update the second cell of the table in each li
    let sections = document.getElementById("sections");
    for (let i = 0; i < sections.children.length; i++) {
        let table = sections.children[i].children[0];
        table.rows[0].cells[1].innerHTML = `Line ${i + 1}`;
    }
}

function clearLine(x) {
    // Clear the textarea of the nth li from the "sections" ul
    let element = document.getElementById(`line${x}`);
    element.children[0].rows[0].cells[2].innerHTML = "{}";
    lines.set(`line${x}`, []);
}


function generateExplanation() {
    let output = document.getElementById("output");
    output.value = "Todo: Implement"
}