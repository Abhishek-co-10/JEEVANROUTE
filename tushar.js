
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
