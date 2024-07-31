document.addEventListener("DOMContentLoaded", function() {
    const dataSection = document.getElementById('dataSection');
    const graphSection = document.getElementById('graphSection');
    const addDataButton = document.getElementById('addData');
    const submitDataButton = document.getElementById('submitData');
    const showGraphButton = document.getElementById('showGraph');
    const filterButton = document.getElementById('filterButton');
    const downloadDataButton = document.getElementById('downloadData');
    const clearDataButton = document.getElementById('clearData');
    let chartInstance;

    addDataButton.addEventListener('click', () => toggleFormVisibility(true));

    submitDataButton.addEventListener('click', () => handleSubmit());

    filterButton.addEventListener('click', () => {
        filterTable();
        displayPieChart();
    });

    showGraphButton.addEventListener('click', () => displayPieChart());
    downloadDataButton.addEventListener('click', () => downloadData());

    clearDataButton.addEventListener('click', () => clearAllData());
    
    function toggleFormVisibility(show) {
        const form = document.getElementById('dataForm');
        form.style.display = show ? 'block' : 'none';
    }

    function handleSubmit() {
        const date = document.getElementById('date').value;
        const abnormality = document.getElementById('abnormality').value;
        const observationFile = document.getElementById('observation').files[0];
        const actionRequired = document.getElementById('actionRequired').value;
        const actionTaken = document.getElementById('actionTaken').value;
        const closerEvidenceFile = document.getElementById('closerEvidence').files[0];
        const status = document.getElementById('status').value;

        if (!date || !abnormality || !observationFile || !actionRequired || !actionTaken || !closerEvidenceFile || !status) {
            alert('Please fill in all fields.');
            return;
        }

        const reader1 = new FileReader();
        const reader2 = new FileReader();

        reader1.onload = function(e1) {
            const observationDataUrl = e1.target.result;
            reader2.onload = function(e2) {
                const closerEvidenceDataUrl = e2.target.result;
                addToExcelTable(date, abnormality, observationDataUrl, actionRequired, actionTaken, closerEvidenceDataUrl, status);
                saveDataToLocalStorage(date, abnormality, observationDataUrl, actionRequired, actionTaken, closerEvidenceDataUrl, status);
                resetForm();
            };
            reader2.readAsDataURL(closerEvidenceFile);
        };
        reader1.readAsDataURL(observationFile);
    }

    function addToExcelTable(date, abnormality, observationDataUrl, actionRequired, actionTaken, closerEvidenceDataUrl, status) {
        const table = document.getElementById('excelTable').getElementsByTagName('tbody')[0];
        const newRow = table.insertRow();

        const serialNumberCell = newRow.insertCell(0);
        serialNumberCell.textContent = table.rows.length; // Serial number is the row number

        const dateCell = newRow.insertCell(1);
        dateCell.textContent = date;

        const abnormalityCell = newRow.insertCell(2);
        abnormalityCell.textContent = abnormality;

        const observationCell = newRow.insertCell(3);
        const observationImg = document.createElement('img');
        observationImg.src = observationDataUrl;
        observationImg.style.width = '100px';
        observationImg.style.height = '100px';
        observationCell.appendChild(observationImg);

        const actionRequiredCell = newRow.insertCell(4);
        actionRequiredCell.textContent = actionRequired;

        const actionTakenCell = newRow.insertCell(5);
        actionTakenCell.textContent = actionTaken;

        const closerEvidenceCell = newRow.insertCell(6);
        const closerEvidenceImg = document.createElement('img');
        closerEvidenceImg.src = closerEvidenceDataUrl;
        closerEvidenceImg.style.width = '100px';
        closerEvidenceImg.style.height = '100px';
        closerEvidenceCell.appendChild(closerEvidenceImg);

        const statusCell = newRow.insertCell(7);
        statusCell.textContent = status;
        statusCell.classList.add(status); // Add class based on status

        updateSummary(); // Update summary after adding row
    }

    function resetForm() {
        const form = document.getElementById('dataForm');
        form.reset();
        toggleFormVisibility(false);
    }

    function updateSummary() {
        const table = document.getElementById('excelTable');
        const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
        
        let totalIssues = 0;
        let resolved = 0;
        let pending = 0;

        Array.from(rows).forEach(row => {
            const status = row.getElementsByTagName('td')[7].textContent.toLowerCase();
            totalIssues++;
            if (status === 'resolved') {
                resolved++;
            } else if (status === 'pending') {
                pending++;
            }
        });

        document.getElementById('totalIssues').textContent = `Total Issues: ${totalIssues}`;
        document.getElementById('resolved').textContent = `Resolved: ${resolved}`;
        document.getElementById('pending').textContent = `Pending: ${pending}`;
    }

    function filterTable() {
        const startDate = new Date(document.getElementById('startDate').value);
        const endDate = new Date(document.getElementById('endDate').value);
        const table = document.getElementById('excelTable');
        const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');

        Array.from(rows).forEach(row => {
            const date = new Date(row.getElementsByTagName('td')[1].textContent);
            row.style.display = (date >= startDate && date <= endDate) ? '' : 'none';
        });
    }

    function displayPieChart() {
        const table = document.getElementById('excelTable');
        const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
        const startDate = new Date(document.getElementById('startDate').value);
        const endDate = new Date(document.getElementById('endDate').value);

        let totalIssues = 0;
        let resolved = 0;
        let pending = 0;

        Array.from(rows).forEach(row => {
            const date = new Date(row.getElementsByTagName('td')[1].textContent);
            const status = row.getElementsByTagName('td')[7].textContent.toLowerCase();

            if (date >= startDate && date <= endDate) {
                totalIssues++;
                if (status === 'resolved') {
                    resolved++;
                } else if (status === 'pending') {
                    pending++;
                }
            }
        });

        const ctx = document.getElementById('myPieChart').getContext('2d');

        if (chartInstance) {
            chartInstance.destroy();
        }

        chartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Resolved', 'Pending', 'Total Issues'],
                datasets: [{
                    data: [resolved, pending, totalIssues],
                    backgroundColor: ['darkgreen', 'red', 'blue'],
                }]
            }
        });

        graphSection.style.display = 'block'; // Show the graph section
    }

    function saveDataToLocalStorage(date, abnormality, observationDataUrl, actionRequired, actionTaken, closerEvidenceDataUrl, status) {
        const storedData = JSON.parse(localStorage.getItem('maintenanceData')) || [];
        storedData.push({ date, abnormality, observationDataUrl, actionRequired, actionTaken, closerEvidenceDataUrl, status });
        localStorage.setItem('maintenanceData', JSON.stringify(storedData));
    }

    function loadDataFromLocalStorage() {
        const storedData = JSON.parse(localStorage.getItem('maintenanceData')) || [];
        storedData.forEach(data => {
            addToExcelTable(data.date, data.abnormality, data.observationDataUrl, data.actionRequired, data.actionTaken, data.closerEvidenceDataUrl, data.status);
        });
    }
    function downloadData() {
        const storedData = JSON.parse(localStorage.getItem('maintenanceData')) || [];
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(storedData));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "maintenanceData.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    function clearAllData() {
        localStorage.removeItem('maintenanceData');
        const tableBody = document.getElementById('excelTable').getElementsByTagName('tbody')[0];
        tableBody.innerHTML = ''; // Clear table
        updateSummary(); // Update summary after clearing data
    }

    // Load data from localStorage when the page loads
    loadDataFromLocalStorage();
    updateSummary();
});