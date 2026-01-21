function initMap(data) {
    require([
        "esri/Map",
        "esri/views/MapView",
        "esri/Graphic",
        "esri/layers/GraphicsLayer"
    ], (Map, MapView, Graphic, GraphicsLayer) => {

        const map = new Map({ basemap: "streets-navigation-vector" });
        const view = new MapView({
            container: "mapDiv",
            map: map,
            center: [-98, 39],
            zoom: 4,
            popup: {
                dockEnabled: false,
                dockOptions: { buttonEnabled: false },
                visibleElements: { featureNavigation: false, collapseButton: false }
            }
        });

        const graphicsLayer = new GraphicsLayer();
        map.add(graphicsLayer);

        const hospitalGroups = d3.groups(data, d => d.Hospital?.trim().replace(/,$/, ""));
        const limitedGroups = hospitalGroups.filter(g => g[0]).slice(0, 400);

        const states = [
            // Coordonnées ajustées pour éviter les zones côtières profondes
            { name: "CA", lonMin:-122, lonMax:-117, latMin:33, latMax:40, pop:39500000 },
            { name: "TX", lonMin:-103, lonMax:-95, latMin:29.5, latMax:35, pop:29000000 },
            { name: "FL", lonMin:-82.5, lonMax:-80.5, latMin:26, latMax:29, pop:21900000 },
            { name: "NY", lonMin:-78, lonMax:-73.5, latMin:41, latMax:44, pop:19400000 },
            { name: "PA", lonMin:-80, lonMax:-75, latMin:40, latMax:42, pop:12800000 },
            { name: "IL", lonMin:-90, lonMax:-88, latMin:38, latMax:42, pop:12700000 },
            { name: "OH", lonMin:-84, lonMax:-81, latMin:39.5, latMax:41.5, pop:11700000 },
            { name: "GA", lonMin:-84.5, lonMax:-82, latMin:32, latMax:34.5, pop:10700000 },
            { name: "NC", lonMin:-82, lonMax:-77, latMin:35, latMax:36, pop:10400000 },
            { name: "MI", lonMin:-86, lonMax:-83, latMin:42.5, latMax:45, pop:10000000 },
            // "Other" est souvent le coupable. On le restreint au centre des USA (Midwest/Plains)
            { name: "Other", lonMin:-105, lonMax:-85, latMin:35, latMax:45, pop:150000000 }
        ];

        function randomUSCoordByPopulation() {
            let totalPop = d3.sum(states, d => d.pop);
            let rand = Math.random() * totalPop;
            let sum = 0;
            let state = states[states.length - 1];

            for (let s of states) {
                sum += s.pop;
                if (rand <= sum) {
                    state = s;
                    break;
                }
            }

            // On réduit les marges de 10% à l'intérieur de chaque boîte pour s'éloigner des côtes
            const margin = 0.1; 
            const lonRange = state.lonMax - state.lonMin;
            const latRange = state.latMax - state.latMin;

            const lon = (state.lonMin + (lonRange * margin)) + Math.random() * (lonRange * (1 - 2 * margin));
            const lat = (state.latMin + (latRange * margin)) + Math.random() * (latRange * (1 - 2 * margin));

            return { lon, lat };
        }

        limitedGroups.forEach((group) => {
            const name = group[0];
            const patients = group[1];
            const { lon, lat } = randomUSCoordByPopulation();
            const numPatients = patients.length;
            const avgBilling = (d3.mean(patients, d => +d.BillingAmount) || 0).toFixed(2);
            const testCounts = d3.rollup(patients, v => v.length, d => d.TestResults);
            const dominantTest = Array.from(testCounts.entries()).sort((a,b) => b[1] - a[1])[0]?.[0] || "N/A";

            const graphic = new Graphic({
                geometry: { type: "point", longitude: lon, latitude: lat },
                symbol: { type: "simple-marker", color: "#1f6feb", size: "10px", outline: { color: "white", width: 1 } },
                attributes: { name, numPatients, avgBilling, dominantTest },
                popupTemplate: {
                    title: "",
                    actions: [],
                    content: `
                        <div class="popup-card">
                            <div class="popup-title"><b>{name}</b></div>
                            <div>
                                <span class="stat-label">Patients :</span>
                                <span style="float:right">{numPatients}</span>
                            </div>
                            <div>
                                <span class="stat-label">Facture Moyenne :</span>
                                <span style="float:right; font-weight: bold; color: #28a745;">{avgBilling} $</span>
                            </div>
                            <div style="margin-top: 10px;">
                                <span class="stat-label">Résultat Dominant :</span><br>
                                <div class="dominant-badge">{dominantTest}</div>
                            </div>
                        </div>
                    `
                }
            });

            graphicsLayer.add(graphic);
        });

        view.on("click", (event) => {
            view.hitTest(event).then((response) => {
                const results = response.results.filter(r => r.graphic && r.graphic.layer === graphicsLayer);
                if (results.length > 0) {
                    const hName = results[0].graphic.attributes.name;
                    const filteredData = data.filter(d => d.Hospital?.trim().replace(/,$/, "") === hName);
                    if (typeof updateD3Charts === "function") updateD3Charts(filteredData);
                }
            });
        });

        const container = document.getElementById("mapDiv");
        view.on("pointer-move", (event) => {
            view.hitTest(event).then((response) => {
                container.style.cursor = response.results.filter(r => r.graphic.layer === graphicsLayer).length > 0 ? "pointer" : "default";
            });
        });
    });
}
