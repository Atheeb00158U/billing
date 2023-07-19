import { initializeApp } from "firebase/app";
import {
    getFirestore, collection, getDocs, doc, getDoc
} from "firebase/firestore";
import { getDatabase, ref, set, get, child, push, numChildren } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyA1_fdhbe5DXUKcYXKSMrnVtEaa-ieySlg",
    authDomain: "billing-software-ee5be.firebaseapp.com",
    databaseURL: "https://billing-software-ee5be-default-rtdb.firebaseio.com",
    projectId: "billing-software-ee5be",
    storageBucket: "billing-software-ee5be.appspot.com",
    messagingSenderId: "752539496104",
    appId: "1:752539496104:web:4530c6fbb50ac07da19c9d",
    measurementId: "G-XSBMH2FDB8"
};

// init Firebase
const app = initializeApp(firebaseConfig);

// init Firestore
const db = getFirestore();
const realtimedb = getDatabase();

// Collection References
const collectionRef = collection(db, "stalls");


// Nav toggle Variables
const menuToggle = document.querySelector('.toggle-button');
const navMenu = document.querySelector('.nav-links');

// ==== Nav toggle functionality
menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

// ==== tags functionality

getDocs(collectionRef)
    .then((querySnapshot) => {
        const stallDiv = document.getElementById("stall-div");

        querySnapshot.forEach((doc) => {
            const stallId = doc.id;


            const div = document.createElement("div");
            div.classList.add("tag");


            const h3 = document.createElement("h3");
            h3.classList.add("stall-label");
            h3.textContent = stallId;

            div.appendChild(h3);
            stallDiv.appendChild(div);
        });
        console.log("added all elements");

    })
    .catch((error) => {
        console.log("Error retrieving data:", error);
    });


// Stall section  Variables

const menuDiv = document.getElementById('menu-div');
let label;
const stallTag = document.querySelectorAll('.tag');
const sec = document.getElementById("stall-div")


sec.addEventListener('click', (event) => {
    while (menuDiv.firstChild) {
        menuDiv.removeChild(menuDiv.firstChild);
    }

    if (event.target.classList.contains('stall-label')) {

        label = event.target.textContent;
        console.log(label);
        const docRef = doc(db, "stalls", label);
        console.log('Clicked label value:', docRef);

        // Getting the data from Firestore ;-;
        getDoc(docRef)
            .then((docSnapshot) => {
                if (docSnapshot.exists()) {
                    const data = docSnapshot.data();
                    const fieldNames = Object.keys(data);

                    fieldNames.forEach((fieldName) => {
                        const card = document.createElement('div');
                        card.classList.add('card');
                        card.setAttribute("id", "menu-card");



                        const itemName = document.createElement('h3');
                        itemName.classList.add('item-name');
                        itemName.textContent = fieldName;

                        const itemPrice = document.createElement('p');
                        itemPrice.classList.add('item-price');
                        itemPrice.textContent = `INR ${data[fieldName]}`;

                        card.appendChild(itemName);
                        card.appendChild(itemPrice);


                        menuDiv.appendChild(card);
                    });
                } else {
                    console.log('Document does not exist');

                }
            })
            .catch((error) => {
                console.log('Error retrieving data:', error);
            });
    }
});

// receipt section  Variables

const tableBody = document.getElementById('newtr');
const orderNum = document.getElementById('order-number');
const receiptDiv = document.getElementById("receipt-div");

menuDiv.addEventListener("click", (event) => {
    if (event.target.classList.contains('card')) {
        const card = event.target;
        const item_name = card.querySelector('.item-name').textContent;
        const item_price = card.querySelector('.item-price').textContent;

        const tableRow = document.createElement("tr");

        const tableData1 = document.createElement("td");
        tableData1.textContent = item_name;
        const tableData2 = document.createElement("td");
        tableData2.textContent = item_price;

        const tableData3 = document.createElement("td");
        const delBtn = document.createElement("button");
        delBtn.classList.add("action");
        delBtn.textContent = "X";

        delBtn.addEventListener("click", (event) => {
            tableRow.remove();
        });

        tableData3.appendChild(delBtn);
        tableRow.append(tableData1, tableData2, tableData3);
        tableBody.appendChild(tableRow);
    }
    else {
        console.log("something went wrong")
    }
});

//uploading to real-time-db :0;

const ordersRef = ref(realtimedb, "orders");


receiptDiv.addEventListener("click", (event) => {


    if (event.target.id.includes("print-btn")) {
        uploadOrder();

        get(ordersRef)
            .then((snapshot) => {
                const orders = snapshot.val();
                const numberOfChildren = Object.keys(orders).length;
                orderNum.textContent = "ORDER: " + numberOfChildren;
            })
            .catch((error) => {
                console.error("Error retrieving data:", error);
            });
        printReceipt();
        const tableRows = document.querySelectorAll("#table tbody tr");
        tableRows.forEach((row) => {
            row.remove();
        });


    }
});

var totalAmt = 0;

function uploadOrder() {
    const tableRows = document.querySelectorAll("#table tbody tr");

    // Get the store name from the selected stall label
    const storeName = label;

    // Create a new order object with the store name and order items
    const order_items = {
        STORE: storeName,
        ITEMS: {}
    };

    // Iterate over the table rows
    tableRows.forEach((row) => {
        const tableCells = row.getElementsByTagName("td");

        if (tableCells.length >= 2) {
            const itemName = tableCells[0].textContent;
            const itemPrice = tableCells[1].textContent;

            // Extract numeric value from price string
            const numericPrice = parseInt(itemPrice.replace("INR", "").trim());

            // Update total amount
            totalAmt += numericPrice;

            order_items.ITEMS[itemName] = itemPrice;
        }
    });

    // Set the total amount in the receipt
    console.log(totalAmt);
    console.log(order_items);

    // Upload the order to the real-time database
    const newOrderRef = push(ordersRef);
    set(newOrderRef, order_items)
        .then(() => {
            console.log("Order uploaded successfully!");
        })
        .catch((error) => {
            console.error("Error uploading order:", error);
        });

    //totalAmt = 0;
}

//=== on page load==//
document.addEventListener("DOMContentLoaded", () => {
    get(ordersRef)
        .then((snapshot) => {
            const orders = snapshot.val();
            const numberOfChildren = Object.keys(orders).length;
            orderNum.textContent = "ORDER: " + numberOfChildren;
        })
        .catch((error) => {
            console.error("Error retrieving data:", error);
        });
});

function printReceipt() {
    const receipt = document.getElementById("receipt-div");
    const clonedReceipt = receipt.cloneNode(true);

    // Remove the action buttons from the cloned receipt
    const actionButtons = clonedReceipt.getElementsByClassName("action");
    while (actionButtons.length > 0) {
        actionButtons[0].parentNode.removeChild(actionButtons[0]);
    }


    const tableHeader = clonedReceipt.querySelector(".table th:nth-child(3)");
    if (tableHeader) {
        tableHeader.parentNode.removeChild(tableHeader);
    }

    const total_amt = document.createElement("h3");
    total_amt.setAttribute("id", "receipt-total-amt");
    total_amt.textContent = "Total Amount: INR " + totalAmt;
    clonedReceipt.appendChild(total_amt);

    // Remove the generate token button
    const printButton = clonedReceipt.querySelector("#print-btn");
    printButton.parentNode.removeChild(printButton);


    const styleElement = document.createElement("style");
    styleElement.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Bruno+Ace+SC&family=Poppins:wght@300;500;700&display=swap');

    head, body, html{
        font-family: poppins
    }
        #receipt-div {
            width: 25%;
            height: 100%;
            padding: 10px;
        }
        #receipt-store-name{
            text-align:center;
        }
        .table-container {
            height: 80%;
            overflow-y: auto;
        }

        .table {
            border-collapse: collapse;
            width: 100%;
        }

        .table th{
            padding: 3px;
            text-align: center;
            border-bottom: 1px solid #ddd;
        }
        .table td {
            padding: 3px;
            text-align: center;
            border-bottom: 1px solid #ddd;
        }

        .table th {
            background-color: #f5f5f5;
        }

        .table tr {
            height: 100px;
        }

        .table tbody tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        h1,h2, p, .logo {
            text-align: center;
        }
        #img-conatainer{
            display: flex;
            justify-content:center;
        }
        .logo {
            width: 50px;
            height: 50px;
            background-color: black;
            color: white;
            margin: 0 auto;
            margin-top: 10px;
            position: relative;
            justify-content:center;
        }
    
        .storename {
            font-size: 24px;
            text-align: center;
            margin-top: 5px;
        }
        #flexcover{
            display:flex;
            flex-direction: column

        }
    `;
    clonedReceipt.insertBefore(styleElement, clonedReceipt.firstChild);

    // Including the dynamically created rows ;-;
    const tableRows = document.querySelectorAll("#table tbody tr");
    const clonedTableBody = clonedReceipt.querySelector("#table tbody");

    // Checking if the cloned receipt already contains rows
    const existingRows = clonedTableBody.querySelectorAll("tr");
    if (existingRows.length === 0) {
        tableRows.forEach((row) => {
            const clonedRow = document.createElement("tr");
            const tableCells = row.querySelectorAll("td");
            tableCells.forEach((cell) => {
                const clonedCell = document.createElement("td");
                clonedCell.textContent = cell.textContent;
                clonedRow.appendChild(clonedCell);
            });
            clonedTableBody.appendChild(clonedRow);
        });
    }

    console.log(clonedReceipt.innerHTML);

    const printWindow = window.open("", "_blank");
    printWindow.document.write("<html><head><title>CPS PRIME MUN</title>");
    printWindow.document.write("<style>");
    printWindow.document.write("</style></head><body> <div id = 'flexcover'>");
    printWindow.document.write("<h1>CPS PRIME MUN 2.0</h1>");
    printWindow.document.write("<p>Chennai Public School Thirumazhisai</p>");
    printWindow.document.write("<h2>Food Token</h2>");
    printWindow.document.write(`<h1 id='receipt-store-name'>${label}</h1>`);
    printWindow.document.write(clonedReceipt.innerHTML);
    printWindow.document.write("</div></body></html>");
    printWindow.document.close();
    printWindow.print();
    printWindow.close();

    totalAmt = 0
}
