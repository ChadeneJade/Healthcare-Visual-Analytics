d3.csv("data/healthcare_dataset.csv").then(rawData => {

    // Nettoyage + typage + valeurs manquantes
    const data = rawData.map(d => {
        const admission = d["Date of Admission"] ? new Date(d["Date of Admission"]) : null;
        const discharge = d["Discharge Date"] ? new Date(d["Discharge Date"]) : null;

        const age = +d.Age;
        const billing = +d["Billing Amount"];

        let ageGroup = "Unknown";
        if (!isNaN(age)) {
            if (age <= 18) ageGroup = "0-18";
            else if (age <= 40) ageGroup = "19-40";
            else if (age <= 65) ageGroup = "41-65";
            else ageGroup = "65+";
        }

        const lengthOfStay = admission && discharge
            ? (discharge - admission) / (1000 * 60 * 60 * 24)
            : null;

        return {
            ...d,
            Age: age || null,
            BillingAmount: billing || null,
            AdmissionDate: admission,
            DischargeDate: discharge,
            LengthOfStay: lengthOfStay,
            Gender: d.Gender ? d.Gender.toLowerCase() : "unknown",
            TestResults: d["Test Results"] ? d["Test Results"].toLowerCase() : "unknown",
            AgeGroup: ageGroup
        };
    });

    window.fullData = data;
    window.filteredData = data;

    updateD3Charts(filteredData);
    initMap(filteredData);

    // Filtres
    d3.select("#genderFilter").on("change", applyFilters);
    d3.select("#ageFilter").on("change", applyFilters);
    d3.select("#resetBtn").on("click", () => {
        d3.select("#genderFilter").property("value", "all");
        d3.select("#ageFilter").property("value", "all");
        filteredData = fullData;
        updateD3Charts(filteredData);
        initMap(filteredData);
    });

    function applyFilters() {
        const gender = d3.select("#genderFilter").property("value");
        const ageGroup = d3.select("#ageFilter").property("value");

        filteredData = fullData.filter(d => {
            const genderMatch = gender === "all" || d.Gender === gender;
            const ageMatch = ageGroup === "all" || d.AgeGroup === ageGroup;
            return genderMatch && ageMatch;
        });

        updateD3Charts(filteredData);
        initMap(filteredData);
    }

});
