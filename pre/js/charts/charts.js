//Desarrollo de las visualizaciones
import * as d3 from 'd3';
//import { numberWithCommas2 } from './helpers';
//import { getInTooltip, getOutTooltip, positionTooltip } from './modules/tooltip';
import { setChartHeight } from '../modules/height';
import { setChartCanvas, setChartCanvasImage } from '../modules/canvas-image';
import { setRRSSLinks } from '../modules/rrss';
import { setFixedIframeUrl } from './chart_helpers';

//Colores fijos
const COLOR_PRIMARY_1 = '#F8B05C', 
COLOR_PRIMARY_2 = '#E37A42',
COLOR_COMP_1 = '#528FAD', 
COLOR_COMP_2 = '#AADCE0',
COLOR_GREY_1 = '#D6D6D6', 
COLOR_GREY_2 = '#A3A3A3',
COLOR_ANAG__PRIM_1 = '#BA9D5F', 
COLOR_ANAG_PRIM_2 = '#9E6C51',
COLOR_ANAG_PRIM_3 = '#9E3515',
COLOR_ANAG_COMP_1 = '#1C5A5E';

export function initChart(iframe) {
    //Lectura de datos
    d3.csv('https://raw.githubusercontent.com/CarlosMunozDiazCSIC/informe_perfil_mayores_2022_economia_3_6/main/data/regimen_tenencia_principal_v2.csv', function(error,data) {
        if (error) throw error;

        //Declaramos fuera las variables genéricas
        let margin = {top: 20, right: 20, bottom: 20, left: 35},
            width = document.getElementById('chart').clientWidth - margin.left - margin.right,
            height = document.getElementById('chart').clientHeight - margin.top - margin.bottom;

        let svg = d3.select("#chart")
            .append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
            .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
        let gruposRegimen = ['propiedad','alquiler','alquiler_inferior','cesion'];

        let x = d3.scaleLinear()
            .domain([-0.5,5.5])
            .range([0, width]);

        let tickLabels = ['Total','16 a 29','30 a 44','45 a 64','65+'];

        let xAxis = function(g){
            g.call(d3.axisBottom(x).ticks(5).tickValues([0,2,3,4,5]).tickFormat((d,i) => tickLabels[i]))
        }
        
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);
        
        let y = d3.scaleLinear()
            .domain([0, 100])
            .range([height, 0]);

        svg.append("g")
            .attr("class", "yaxis")
            .call(d3.axisLeft(y));

        let color = d3.scaleOrdinal()
            .domain(gruposRegimen)
            .range([COLOR_PRIMARY_1, COLOR_COMP_2, COLOR_COMP_1, COLOR_OTHER_1]);

        let stackedDataRegimen = d3.stack()
            .keys(gruposRegimen)
            (data);

        function init() {
            svg.append("g")
                .attr('class','chart-g')
                .selectAll("g")
                .data(stackedDataRegimen)
                .enter()
                .append("g")
                .attr("fill", function(d) { return color(d.key); })
                .selectAll("rect")
                .data(function(d) { return d; })
                .enter()
                .append("rect")
                    .attr('class','prueba')
                    .attr("x", function(d) {
                        if(document.getElementById('chart').clientWidth < 400) {
                            return x(d.data.id) - 15;
                        } else {
                            return x(d.data.id) - 25;
                        }
                    })
                    .attr("y", function(d) { return y(0); })
                    .attr("height", function(d) { return 0; })
                    .attr("width", function() {
                        if(document.getElementById('chart').clientWidth < 400) {
                            return '30px';
                        } else {
                            return '50px';
                        }
                    })
                    .transition()
                    .duration(2000)
                    .attr("y", function(d) { return y(d[1]); })
                    .attr("height", function(d) { return y(d[0]) - y(d[1]); });
        }

        function animateChart() {
            svg.selectAll('.prueba')
                .attr("x", function(d) {
                    if(document.getElementById('chart').clientWidth < 400) {
                        return x(d.data.id) - 15;
                    } else {
                        return x(d.data.id) - 25;
                    }
                })
                .attr("y", function(d) { return y(0); })
                .attr("height", function(d) { return 0; })
                .attr("width", function() {
                    if(document.getElementById('chart').clientWidth < 400) {
                        return '30px';
                    } else {
                        return '50px';
                    }
                })
                .transition()
                .duration(2000)
                .attr("y", function(d) { return y(d[1]); })
                .attr("height", function(d) { return y(d[0]) - y(d[1]); });
        }

        //////
        ///// Resto - Chart
        //////
        init();

        //Animación del gráfico
        document.getElementById('replay').addEventListener('click', function() {
            animateChart();
        });

        //////
        ///// Resto
        //////

        //Iframe
        setFixedIframeUrl('informe_perfil_mayores_2022_economia_3_6','distribucion_regimen_tenencia');

        //Redes sociales > Antes tenemos que indicar cuál sería el texto a enviar
        setRRSSLinks('distribucion_regimen_tenencia');

        //Captura de pantalla de la visualización
        setChartCanvas();        

        let pngDownload = document.getElementById('pngImage');

        pngDownload.addEventListener('click', function(){
            setChartCanvasImage('distribucion_regimen_tenencia');
        });

        //Altura del frame
        setChartHeight(iframe);
    });    
}