function updateD3Charts(data) {
    drawTestResultsDonut(data);
    drawMedicalConditionHeatmap(data);
    drawBillingAreaChart(data);
    drawDemographicsGrouped(data);
}

// Tooltip global
const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip");

// ==========================
// Donut Chart — Resultats
// ==========================
function drawTestResultsDonut(data) {
    const counts = d3.rollup(data, v => v.length, d => d.TestResults);
    const dataset = Array.from(counts, ([key, value]) => ({ key, value }));

    const width = 260, height = 260, radius = Math.min(width, height) / 2;

    d3.select("#chart-test-results svg").remove();
    const svg = d3.select("#chart-test-results")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const color = d3.scaleOrdinal()
        .domain(dataset.map(d => d.key))
        .range(d3.schemeSet2);

    const pie = d3.pie().value(d => d.value);
    const arc = d3.arc().innerRadius(radius * 0.55).outerRadius(radius);

    svg.selectAll("path")
        .data(pie(dataset))
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.key))
        .attr("stroke", "white")
        .style("stroke-width", "2px")
        .on("mouseover", function (event, d) {
            d3.select(this).transition().duration(200).attr("transform", "scale(1.05)");
            tooltip.style("opacity", 1)
                .html(`<strong>${d.data.key}</strong><br>${d.data.value} patients`)
                .style("left", (event.pageX + 12) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", function () {
            d3.select(this).transition().duration(200).attr("transform", "scale(1)");
            tooltip.style("opacity", 0);
        });
}

// ======================================
//  Heatmap — Conditions vs Resultats
// ======================================
function drawMedicalConditionHeatmap(data) {
    const conditions = Array.from(new Set(data.map(d => d["Medical Condition"])));
    const results = Array.from(new Set(data.map(d => d.TestResults)));

    const matrix = [];
    conditions.forEach(cond => {
        results.forEach(res => {
            const count = data.filter(d => d["Medical Condition"] === cond && d.TestResults === res).length;
            matrix.push({ cond, res, count });
        });
    });

    const margin = { top: 50, right: 20, bottom: 80, left: 140 };
    const width = 380 - margin.left - margin.right;
    const height = 260 - margin.top - margin.bottom;

    d3.select("#chart-medical-conditions svg").remove();
    const svg = d3.select("#chart-medical-conditions")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const x = d3.scaleBand().domain(results).range([0, width]).padding(0.05);
    const y = d3.scaleBand().domain(conditions).range([0, height]).padding(0.05);

    const maxVal = d3.max(matrix, d => d.count);
    const color = d3.scaleLinear()
        .domain([0, maxVal])
        .range(["#deebf7", "#08519c"]);

    // Axes
    svg.append("g")
        .call(d3.axisTop(x))
        .selectAll("path, line")
        .attr("stroke", "#333");

    svg.append("g")
        .call(d3.axisLeft(y))
        .selectAll("path, line")
        .attr("stroke", "#333");

    // Labels axes
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -30)
        .attr("text-anchor", "middle")
        .attr("font-weight", "600")
        .text("Résultats des tests");

    svg.append("text")
        .attr("x", -height / 2)
        .attr("y", -110)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .attr("font-weight", "600")
        .text("Conditions médicales");

    // Heatmap cells
    svg.selectAll()
        .data(matrix)
        .enter()
        .append("rect")
        .attr("x", d => x(d.res))
        .attr("y", d => y(d.cond))
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .style("fill", d => color(d.count))
        .style("opacity", d => d.count / maxVal + 0.25)
        .on("mouseover", function (event, d) {
            tooltip.style("opacity", 1)
                .html(`<strong>${d.cond}</strong><br>${d.res}: ${d.count} patients`)
                .style("left", (event.pageX + 12) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", () => tooltip.style("opacity", 0));
}

// ======================================
//  Montants factures
// ======================================
function drawBillingAreaChart(data) {
    const billing = data
        .map(d => d.BillingAmount)
        .filter(d => d != null)
        .sort(d3.ascending);

    const bins = d3.bin().thresholds(12)(billing);

    const margin = { top: 30, right: 20, bottom: 60, left: 60 };
    const width = 380 - margin.left - margin.right;
    const height = 260 - margin.top - margin.bottom;

    d3.select("#chart-billing svg").remove();
    const svg = d3.select("#chart-billing")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const x = d3.scaleLinear()
        .domain([d3.min(billing), d3.max(billing)])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length)])
        .nice()
        .range([height, 0]);

    // Axes
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .call(d3.axisLeft(y));

    // Labels axes
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 45)
        .attr("text-anchor", "middle")
        .attr("font-weight", "600")
        .text("Montant facturé ($)");

    svg.append("text")
        .attr("x", -height / 2)
        .attr("y", -45)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .attr("font-weight", "600")
        .text("Nombre de patients");

    const area = d3.area()
        .x(d => x((d.x0 + d.x1) / 2))
        .y0(height)
        .y1(d => y(d.length))
        .curve(d3.curveMonotoneX);

    const line = d3.line()
        .x(d => x((d.x0 + d.x1) / 2))
        .y(d => y(d.length))
        .curve(d3.curveMonotoneX);

    svg.append("path")
        .datum(bins)
        .attr("fill", "#cce5ff")
        .attr("d", area);

    svg.append("path")
        .datum(bins)
        .attr("fill", "none")
        .attr("stroke", "#1f6feb")
        .attr("stroke-width", 2)
        .attr("d", line);

    svg.selectAll("circle")
        .data(bins)
        .enter()
        .append("circle")
        .attr("cx", d => x((d.x0 + d.x1) / 2))
        .attr("cy", d => y(d.length))
        .attr("r", 4)
        .attr("fill", "#1f6feb")
        .on("mouseover", function (event, d) {
            tooltip.style("opacity", 1)
                .html(`Montant ≈ ${Math.round((d.x0 + d.x1) / 2)}<br>${d.length} patients`)
                .style("left", (event.pageX + 12) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", () => tooltip.style("opacity", 0));
}

// ======================================
// 4️⃣ Barres groupées — Démographie
// ======================================
function drawDemographicsGrouped(data) {
    const ageGroups = ['0-18', '19-40', '41-65', '65+'];
    const genders = Array.from(new Set(data.map(d => d.Gender)));

    const dataset = ageGroups.map(age => {
        const obj = { ageGroup: age };
        genders.forEach(g => {
            obj[g] = data.filter(d => d.AgeGroup === age && d.Gender === g).length;
        });
        return obj;
    });

    const margin = { top: 30, right: 20, bottom: 60, left: 60 };
    const width = 380 - margin.left - margin.right;
    const height = 260 - margin.top - margin.bottom;

    d3.select("#chart-demographics svg").remove();
    const svg = d3.select("#chart-demographics")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const x0 = d3.scaleBand().domain(ageGroups).range([0, width]).padding(0.2);
    const x1 = d3.scaleBand().domain(genders).range([0, x0.bandwidth()]).padding(0.1);
    const y = d3.scaleLinear()
        .domain([0, d3.max(dataset, d => d3.max(genders, g => d[g]))])
        .nice()
        .range([height, 0]);

    const color = d3.scaleOrdinal(d3.schemeSet2).domain(genders);

    // Axes
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x0));

    svg.append("g")
        .call(d3.axisLeft(y));

    // Labels axes
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 45)
        .attr("text-anchor", "middle")
        .attr("font-weight", "600")
        .text("Groupes d'âge");

    svg.append("text")
        .attr("x", -height / 2)
        .attr("y", -45)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .attr("font-weight", "600")
        .text("Nombre de patients");

    const groups = svg.selectAll(".ageGroup")
        .data(dataset)
        .enter()
        .append("g")
        .attr("class", "ageGroup")
        .attr("transform", d => `translate(${x0(d.ageGroup)},0)`);

    groups.selectAll("rect")
        .data(d => genders.map(g => ({ key: g, value: d[g] })))
        .enter()
        .append("rect")
        .attr("x", d => x1(d.key))
        .attr("y", d => y(d.value))
        .attr("width", x1.bandwidth())
        .attr("height", d => height - y(d.value))
        .attr("fill", d => color(d.key))
        .on("mouseover", function (event, d) {
            tooltip.style("opacity", 1)
                .html(`<strong>${d.key}</strong><br>${d.value} patients`)
                .style("left", (event.pageX + 12) + "px")
                .style("top", (event.pageY - 20) + "px");
        })
        .on("mouseout", () => tooltip.style("opacity", 0));
}
