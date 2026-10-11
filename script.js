/* =========================================================
   JEEVANROUTE - FRONTEND JAVASCRIPT
   ========================================================= */


/* ================= DATA ================= */

let patients = [];
let emergencyQueue = [];
let dispatchHistory = [];

const ambulances = [
    {
        id: 1,
        location: "Village A",
        available: true
    },
    {
        id: 2,
        location: "Village B",
        available: true
    },
    {
        id: 3,
        location: "Village C",
        available: false
    },
    {
        id: 4,
        location: "Village D",
        available: true
    },
    {
        id: 5,
        location: "Village E",
        available: false
    }
];

const hospitals = [
    {
        id: 1,
        name: "City Hospital",
        location: "City Center",
        icu: true,
        oxygen: true
    },
    {
        id: 2,
        name: "Rural Care Hospital",
        location: "Rural Area",
        icu: false,
        oxygen: true
    },
    {
        id: 3,
        name: "Emergency Care Hospital",
        location: "Main Road",
        icu: true,
        oxygen: true
    },
    {
        id: 4,
        name: "Community Hospital",
        location: "Village Road",
        icu: false,
        oxygen: false
    },
    {
        id: 5,
        name: "District Hospital",
        location: "District Center",
        icu: true,
        oxygen: true
    }
];


/* ================= INITIALIZATION ================= */

document.addEventListener("DOMContentLoaded", function () {

    console.log("JeevanRoute JavaScript initialized.");

    updateDate();

    renderPatients();

    renderAmbulances();

    renderHospitals();

    renderEmergencyQueue();

    renderHistory();

    updateDashboard();

    setupPatientForm();

    setupEmergencyForm();

    console.log("JeevanRoute loaded successfully.");

});


/* ================= DATE ================= */

function updateDate() {

    const dateElement =
        document.querySelector("#current-date span");

    if (!dateElement) {
        return;
    }

    const now = new Date();

    const options = {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
    };

    dateElement.textContent =
        now.toLocaleDateString(
            "en-IN",
            options
        );
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function showSection(sectionId, clickedButton) {

    console.log("Opening section:", sectionId);

    const sections =
        document.querySelectorAll(".page-section");

    sections.forEach(function (section) {

        section.classList.remove(
            "active-section"
        );

    });


    const selectedSection =
        document.getElementById(sectionId);

    if (!selectedSection) {

        console.error(
            "Section not found:",
            sectionId
        );

        return;
    }


    selectedSection.classList.add(
        "active-section"
    );


    const buttons =
        document.querySelectorAll(".nav-item");

    buttons.forEach(function (button) {

        button.classList.remove("active");

    });


    if (clickedButton) {

        clickedButton.classList.add("active");

    }


    updatePageTitle(sectionId);
}


function showSectionById(sectionId) {

    console.log(
        "showSectionById:",
        sectionId
    );

    const buttons =
        document.querySelectorAll(".nav-item");

    let selectedButton = null;

    buttons.forEach(function (button) {

        const onclick =
            button.getAttribute("onclick");

        if (
            onclick &&
            onclick.includes(
                "'" + sectionId + "'"
            )
        ) {

            selectedButton = button;

        }

    });


    showSection(
        sectionId,
        selectedButton
    );
}


function updatePageTitle(sectionId) {

    const titles = {

        dashboard: [
            "Dashboard",
            "Rural Emergency Response System"
        ],

        patients: [
            "Patient Management",
            "Register and manage patients"
        ],

        emergency: [
            "Emergency Management",
            "Report and process emergency requests"
        ],

        ambulances: [
            "Ambulance Fleet",
            "Monitor ambulance availability"
        ],

        hospitals: [
            "Hospital Network",
            "Available medical facilities"
        ],

        history: [
            "Dispatch History",
            "Previous ambulance dispatches"
        ]

    };


    const data =
        titles[sectionId];

    if (!data) {
        return;
    }


    const title =
        document.getElementById(
            "page-title"
        );

    const subtitle =
        document.getElementById(
            "page-subtitle"
        );


    if (title) {

        title.textContent =
            data[0];

    }


    if (subtitle) {

        subtitle.textContent =
            data[1];

    }
}


/* =========================================================
   PATIENT REGISTRATION
   ========================================================= */

function openRegisterPatient() {

    const modal =
        document.getElementById(
            "patient-modal"
        );

    if (!modal) {
        console.error(
            "Patient modal not found."
        );

        return;
    }


    modal.classList.add("show");


    setTimeout(function () {

        const idInput =
            document.getElementById(
                "patient-id"
            );

        if (idInput) {

            idInput.focus();

        }

    }, 100);
}


function closeRegisterPatient() {

    const modal =
        document.getElementById(
            "patient-modal"
        );

    if (modal) {

        modal.classList.remove(
            "show"
        );

    }

}


function setupPatientForm() {

    const form =
        document.getElementById(
            "patient-form"
        );

    if (!form) {

        console.error(
            "Patient form not found."
        );

        return;
    }


    form.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            registerPatient();

        }
    );

}


function registerPatient() {

    const id =
        Number(
            document.getElementById(
                "patient-id"
            ).value
        );

    const name =
        document.getElementById(
            "patient-name"
        ).value.trim();

    const age =
        Number(
            document.getElementById(
                "patient-age"
            ).value
        );

    const location =
        document.getElementById(
            "patient-location"
        ).value.trim();


    if (
        !id ||
        !name ||
        !age ||
        !location
    ) {

        showToast(
            "Invalid Input",
            "Please fill all patient details.",
            "error"
        );

        return;
    }


    const alreadyExists =
        patients.some(function (patient) {

            return patient.id === id;

        });


    if (alreadyExists) {

        showToast(
            "Duplicate Patient",
            "A patient with this ID already exists.",
            "error"
        );

        return;
    }


    const patient = {

        id: id,

        name: name,

        age: age,

        location: location

    };


    patients.push(patient);


    renderPatients();

    renderEmergencyPatientOptions();

    updateDashboard();


    closeRegisterPatient();


    document
        .getElementById("patient-form")
        .reset();


    showToast(
        "Patient Registered",
        name + " has been successfully registered."
    );
}


/* =========================================================
   PATIENT DISPLAY
   ========================================================= */

function renderPatients() {

    const table =
        document.getElementById(
            "patient-table"
        );

    const empty =
        document.getElementById(
            "no-patients"
        );


    if (!table) {
        return;
    }


    table.innerHTML = "";


    if (patients.length === 0) {

        if (empty) {

            empty.style.display =
                "block";

        }

        return;
    }


    if (empty) {

        empty.style.display =
            "none";

    }


    patients.forEach(function (patient) {

        const row =
            document.createElement(
                "tr"
            );


        row.innerHTML = `

            <td>
                <strong>
                    #${patient.id}
                </strong>
            </td>

            <td>
                <strong>
                    ${escapeHTML(patient.name)}
                </strong>
            </td>

            <td>
                ${patient.age}
            </td>

            <td>
                ${escapeHTML(patient.location)}
            </td>

            <td>
                <span class="status-badge available">
                    <i class="fa-solid fa-check"></i>
                    Registered
                </span>
            </td>

        `;


        table.appendChild(row);

    });
}


/* =========================================================
   FIND PATIENT
   ========================================================= */

function findPatient(id) {

    return patients.find(
        function (patient) {

            return patient.id === Number(id);

        }
    );

}


/* =========================================================
   EMERGENCY FORM
   ========================================================= */

function setupEmergencyForm() {

    const form =
        document.getElementById(
            "emergency-form"
        );

    if (!form) {
        return;
    }


    form.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            reportEmergency();

        }
    );


    renderEmergencyPatientOptions();

}


function renderEmergencyPatientOptions() {

    const select =
        document.getElementById(
            "emergency-patient"
        );

    if (!select) {
        return;
    }


    select.innerHTML = `

        <option value="">
            Select Patient
        </option>

    `;


    patients.forEach(function (patient) {

        const option =
            document.createElement(
                "option"
            );

        option.value =
            patient.id;

        option.textContent =
            "#" +
            patient.id +
            " - " +
            patient.name;

        select.appendChild(option);

    });

}


/* =========================================================
   REPORT EMERGENCY
   ========================================================= */

function reportEmergency() {

    const select =
        document.getElementById(
            "emergency-patient"
        );


    if (!select) {
        return;
    }


    const patientId =
        Number(select.value);


    if (!patientId) {

        showToast(
            "Select Patient",
            "Please select a patient first.",
            "error"
        );

        return;
    }


    if (
        emergencyQueue.includes(
            patientId
        )
    ) {

        showToast(
            "Already in Queue",
            "This patient is already waiting for emergency processing.",
            "error"
        );

        return;
    }


    emergencyQueue.push(
        patientId
    );


    renderEmergencyQueue();

    updateDashboard();


    select.value = "";


    showToast(
        "Emergency Reported",
        "Patient added to the emergency queue."
    );
}


/* =========================================================
   EMERGENCY QUEUE
   ========================================================= */

function renderEmergencyQueue() {

    const container =
        document.getElementById(
            "emergency-list"
        );

    const badge =
        document.getElementById(
            "emergency-queue-badge"
        );


    if (!container) {
        return;
    }


    if (badge) {

        badge.textContent =
            emergencyQueue.length +
            " Waiting";

    }


    if (
        emergencyQueue.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-check-circle"></i>

                <p>
                    No emergency requests
                </p>

                <small>
                    Everything is under control
                </small>

            </div>

        `;

        return;
    }


    container.innerHTML = "";


    emergencyQueue.forEach(
        function (patientId, index) {

            const patient =
                findPatient(patientId);


            if (!patient) {
                return;
            }


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "emergency-item";


            item.innerHTML = `

                <div class="emergency-patient">

                    <div class="patient-avatar">

                        <i class="fa-solid fa-user"></i>

                    </div>

                    <div>

                        <strong>
                            ${escapeHTML(patient.name)}
                        </strong>

                        <small>
                            Patient #${patient.id}
                            • Age ${patient.age}
                        </small>

                    </div>

                </div>

                <span class="status-badge waiting">

                    Position ${index + 1}

                </span>

            `;


            container.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   PROCESS EMERGENCY
   ========================================================= */

function processEmergency() {

    if (
        emergencyQueue.length === 0
    ) {

        showToast(
            "Queue Empty",
            "There are no emergency requests to process.",
            "error"
        );

        return;
    }


    const ambulance =
        ambulances.find(
            function (item) {

                return item.available;

            }
        );


    if (!ambulance) {

        showToast(
            "No Ambulance Available",
            "All ambulances are currently busy.",
            "error"
        );

        return;
    }


    const patientId =
        emergencyQueue.shift();


    const patient =
        findPatient(patientId);


    if (!patient) {

        showToast(
            "Error",
            "Patient could not be found.",
            "error"
        );

        return;
    }


    ambulance.available =
        false;


    /*
        For now, select the best hospital
        based on ICU + Oxygen availability.
    */

    const hospital =
        chooseHospital();


    if (!hospital) {

        ambulance.available =
            true;

        emergencyQueue.unshift(
            patientId
        );

        renderEmergencyQueue();

        updateDashboard();

        showToast(
            "No Hospital Available",
            "No suitable hospital was found.",
            "error"
        );

        return;
    }


    dispatchHistory.push({

        patientId:
            patient.id,

        patientName:
            patient.name,

        ambulanceId:
            ambulance.id,

        hospitalName:
            hospital.name,

        time:
            new Date().toISOString()

    });


    renderEmergencyQueue();

    renderHistory();

    renderAmbulances();

    updateDashboard();


    showToast(
        "Emergency Dispatched",
        "Ambulance " +
        ambulance.id +
        " dispatched to " +
        hospital.name +
        "."
    );

}


/* =========================================================
   CHOOSE HOSPITAL
   ========================================================= */

function chooseHospital() {

    const suitable =
        hospitals.filter(
            function (hospital) {

                return (
                    hospital.icu === true &&
                    hospital.oxygen === true
                );

            }
        );


    if (
        suitable.length === 0
    ) {

        return null;

    }


    return suitable[0];

}


/* =========================================================
   AMBULANCES
   ========================================================= */

function renderAmbulances() {

    const container =
        document.getElementById(
            "ambulance-grid"
        );

    if (!container) {
        return;
    }


    container.innerHTML = "";


    ambulances.forEach(
        function (ambulance) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "ambulance-card";


            const statusClass =
                ambulance.available
                    ? "available"
                    : "busy";


            const statusText =
                ambulance.available
                    ? "Available"
                    : "Busy";


            card.innerHTML = `

                <div class="ambulance-top">

                    <div class="ambulance-icon">

                        <i class="fa-solid fa-truck-medical"></i>

                    </div>

                    <span class="status-badge ${statusClass}">

                        ${statusText}

                    </span>

                </div>

                <h3>
                    Ambulance ${ambulance.id}
                </h3>

                <p>
                    Emergency Response Unit
                </p>

                <div class="ambulance-location">

                    <i class="fa-solid fa-location-dot"></i>

                    ${escapeHTML(ambulance.location)}

                </div>

            `;


            container.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   HOSPITALS
   ========================================================= */

function renderHospitals() {

    const container =
        document.getElementById(
            "hospital-grid"
        );

    if (!container) {
        return;
    }


    container.innerHTML = "";


    hospitals.forEach(
        function (hospital) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "hospital-card";


            card.innerHTML = `

                <div class="hospital-header">

                    <div class="hospital-icon">

                        <i class="fa-solid fa-hospital"></i>

                    </div>

                    <div>

                        <h3>
                            ${escapeHTML(hospital.name)}
                        </h3>

                        <p>

                            <i class="fa-solid fa-location-dot"></i>

                            ${escapeHTML(hospital.location)}

                        </p>

                    </div>

                </div>

                <div class="facilities">

                    <span class="facility ${
                        hospital.icu
                            ? "available"
                            : "unavailable"
                    }">

                        <i class="fa-solid ${
                            hospital.icu
                                ? "fa-check"
                                : "fa-xmark"
                        }"></i>

                        ICU

                    </span>

                    <span class="facility ${
                        hospital.oxygen
                            ? "available"
                            : "unavailable"
                    }">

                        <i class="fa-solid ${
                            hospital.oxygen
                                ? "fa-check"
                                : "fa-xmark"
                        }"></i>

                        Oxygen

                    </span>

                </div>

            `;


            container.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   DISPATCH HISTORY
   ========================================================= */

function renderHistory() {

    const table =
        document.getElementById(
            "history-table"
        );

    const empty =
        document.getElementById(
            "no-history"
        );


    if (!table) {
        return;
    }


    table.innerHTML = "";


    if (
        dispatchHistory.length === 0
    ) {

        if (empty) {

            empty.style.display =
                "block";

        }

        return;
    }


    if (empty) {

        empty.style.display =
            "none";

    }


    dispatchHistory.forEach(
        function (dispatch) {

            const row =
                document.createElement(
                    "tr"
                );


            const time =
                new Date(
                    dispatch.time
                ).toLocaleTimeString(
                    "en-IN",
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );


            row.innerHTML = `

                <td>

                    <strong>
                        ${escapeHTML(
                            dispatch.patientName
                        )}
                    </strong>

                    <small
                        style="
                            display:block;
                            color:#94a3b8;
                        "
                    >
                        #${dispatch.patientId}
                    </small>

                </td>

                <td>

                    <strong>
                        AMB-${dispatch.ambulanceId}
                    </strong>

                </td>

                <td>

                    ${escapeHTML(
                        dispatch.hospitalName
                    )}

                </td>

                <td>

                    <span class="status-badge dispatched">

                        <i class="fa-solid fa-truck-medical"></i>

                        Dispatched

                    </span>

                </td>

                <td>
                    ${time}
                </td>

            `;


            table.appendChild(
                row
            );

        }
    );

}


/* =========================================================
   DASHBOARD
   ========================================================= */

function updateDashboard() {

    const total =
        document.getElementById(
            "total-patients"
        );

    const queue =
        document.getElementById(
            "queue-count"
        );

    const available =
        document.getElementById(
            "available-ambulances"
        );


    if (total) {

        total.textContent =
            patients.length;

    }


    if (queue) {

        queue.textContent =
            emergencyQueue.length;

    }


    if (available) {

        available.textContent =
            ambulances.filter(
                function (ambulance) {

                    return ambulance.available;

                }
            ).length;

    }


    updateDashboardQueue();

}


/* =========================================================
   DASHBOARD QUEUE
   ========================================================= */

function updateDashboardQueue() {

    const container =
        document.getElementById(
            "dashboard-queue"
        );

    if (!container) {
        return;
    }


    if (
        emergencyQueue.length === 0
    ) {

        container.innerHTML = `

            <i class="fa-solid fa-circle-check"></i>

            <p>
                No emergency requests
            </p>

            <small>
                Everything is under control
            </small>

        `;

        return;
    }


    container.innerHTML = "";


    emergencyQueue
        .slice(0, 4)
        .forEach(
            function (
                patientId,
                index
            ) {

                const patient =
                    findPatient(
                        patientId
                    );


                if (!patient) {
                    return;
                }


                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "emergency-item";


                item.innerHTML = `

                    <div class="emergency-patient">

                        <div class="patient-avatar">

                            <i class="fa-solid fa-user"></i>

                        </div>

                        <div>

                            <strong>
                                ${escapeHTML(
                                    patient.name
                                )}
                            </strong>

                            <small>
                                Patient #${patient.id}
                            </small>

                        </div>

                    </div>

                    <span class="status-badge waiting">

                        Position ${index + 1}

                    </span>

                `;


                container.appendChild(
                    item
                );

            }
        );

}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(
    title,
    message,
    type = "success"
) {

    const toast =
        document.getElementById(
            "toast"
        );

    const icon =
        document.getElementById(
            "toast-icon"
        );

    const titleElement =
        document.getElementById(
            "toast-title"
        );

    const messageElement =
        document.getElementById(
            "toast-message"
        );


    if (!toast) {
        return;
    }


    if (titleElement) {

        titleElement.textContent =
            title;

    }


    if (messageElement) {

        messageElement.textContent =
            message;

    }


    if (icon) {

        if (type === "error") {

            icon.className =
                "fa-solid fa-circle-exclamation";

            icon.style.color =
                "#dc2626";

        } else {

            icon.className =
                "fa-solid fa-circle-check";

            icon.style.color =
                "#16a34a";

        }

    }


    toast.classList.add(
        "show"
    );


    clearTimeout(
        window.toastTimeout
    );


    window.toastTimeout =
        setTimeout(
            hideToast,
            4000
        );

}


function hideToast() {

    const toast =
        document.getElementById(
            "toast"
        );

    if (toast) {

        toast.classList.remove(
            "show"
        );

    }

}


/* =========================================================
   MODAL CLICK OUTSIDE
   ========================================================= */

document.addEventListener(
    "click",
    function (event) {

        const modal =
            document.getElementById(
                "patient-modal"
            );


        if (
            modal &&
            event.target === modal
        ) {

            closeRegisterPatient();

        }

    }
);


/* =========================================================
   ESCAPE KEY
   ========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape"
        ) {

            closeRegisterPatient();

        }

    }
);


/* =========================================================
   HTML SECURITY
   ========================================================= */

function escapeHTML(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   MAKE FUNCTIONS AVAILABLE TO HTML
   ========================================================= */

window.showSection =
    showSection;

window.showSectionById =
    showSectionById;

window.openRegisterPatient =
    openRegisterPatient;

window.closeRegisterPatient =
    closeRegisterPatient;

window.processEmergency =
    processEmergency;

window.hideToast =
    hideToast;

console.log(
    "All JeevanRoute functions are ready."
);