// js/map.js

function initMap(data) {
    require([
        "esri/Map",
        "esri/views/MapView",
        "esri/Graphic",
        "esri/layers/GraphicsLayer"
    ], (Map, MapView, Graphic, GraphicsLayer) => {

        // 🔹 Nettoyer et normaliser les données
        data.forEach(d => {
            if (d.Hospital) {
                d.Hospital = d.Hospital.trim();           // enlever espaces début/fin
                d.Hospital = d.Hospital.replace(/,$/, ""); // enlever virgule finale
            }
            d.BillingAmount = +d.BillingAmount || 0;
        });

        const hospitals = Array.from(new Set(data.map(d => d.Hospital))).filter(h => h);

        const map = new Map({ basemap: "streets-navigation-vector" });
        const view = new MapView({
            container: "mapDiv",
            map: map,
            center: [-98, 39],
            zoom: 4
        });

        const graphicsLayer = new GraphicsLayer();
        map.add(graphicsLayer);

        // 🔹 Générer des coordonnées visibles autour du centre USA
        function generateCoords(index) {
            const baseLon = -98;
            const baseLat = 39;
            return [
                baseLon + (index % 10) * 2 - 9,
                baseLat + Math.floor(index / 10) * 2 - 5
            ];
        }

        // 🔹 Ajouter les points pour chaque hôpital
        hospitals.forEach((name, index) => {
            const coords = generateCoords(index);

            const point = { type: "point", longitude: coords[0], latitude: coords[1] };
            const markerSymbol = {
                type: "simple-marker",
                color: "#1f6feb",
                size: "12px",
                outline: { color: "white", width: 1 }
            };

            const patients = data.filter(d => {
                const cleanHospital = d.Hospital ? d.Hospital.trim().replace(/,$/, "") : "";
                return cleanHospital === name;
            });

            if (patients.length === 0) return; // ignorer si aucun patient

            const avgBilling = (patients.reduce((sum, d) => sum + (+d.BillingAmount || 0), 0) / patients.length).toFixed(2);

            const testCounts = {};
            patients.forEach(d => testCounts[d.TestResults] = (testCounts[d.TestResults] || 0) + 1);
            const dominantTest = Object.entries(testCounts).sort((a,b)=> b[1]-a[1])[0]?.[0] || "N/A";

            const graphic = new Graphic({
                geometry: point,
                symbol: markerSymbol,
                attributes: { name, numPatients: patients.length, avgBilling, dominantTest },
                popupTemplate: {
                    title: "🏥 {name}",
                    content: `
                        <b>Patients :</b> {numPatients}<br>
                        <b>Facture moyenne :</b> {avgBilling}$<br>
                        <b>Résultat dominant :</b> {dominantTest}
                    `
                }
            });

            // 🔹 Clic pour filtrer D3
            graphic.on("click", () => {
                const filtered = data.filter(d => {
                    const cleanHospital = d.Hospital ? d.Hospital.trim().replace(/,$/, "") : "";
                    return cleanHospital === name;
                });
                updateD3Charts(filtered);
            });

            graphicsLayer.add(graphic);
        });

        // 🔹 Recentre la carte sur tous les points ajoutés
        view.whenLayerView(graphicsLayer).then(() => {
            if (graphicsLayer.graphics.length > 0) {
                view.goTo(graphicsLayer.graphics).catch(() => {});
            }
        });
    });
}

// 🔹 Charger le CSV et lancer la carte
d3.csv("data/healthcare_dataset.csv").then(data => {
    initMap(data);
});
