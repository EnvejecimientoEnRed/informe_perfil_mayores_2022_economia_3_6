//Desarrollo de las visualizaciones
import * as d3 from 'd3';
import { numberWithCommas3 } from '../helpers';
import { getInTooltip, getOutTooltip, positionTooltip } from '../modules/tooltip';
import { setChartHeight } from '../modules/height';
import { setChartCanvas, setChartCanvasImage } from '../modules/canvas-image';
import { setRRSSLinks } from '../modules/rrss';
import { setFixedIframeUrl } from './chart_helpers';

//Colores fijos
const COLOR_PRIMARY_1 = '#F8B05C',
COLOR_ANAG_PRIM_1 = '#BA9D5F', 
COLOR_ANAG_PRIM_2 = '#9E6C51',
COLOR_ANAG_PRIM_3 = '#9E3515';
let tooltip = d3.select('#tooltip');

//Diccionario
let dictionary = {
    propiedad: 'Propiedad',
    alquiler: 'Alquiler a precio de mercado',
    alquiler_inferior: 'Alquiler inferior a precio de mercado',
    cesion: 'Cesión gratuita'
};

export function initChart() {
    //Lectura de datos
    d3.csv('https://raw.githubusercontent.com/CarlosMunozDiazCSIC/informe_perfil_mayores_2022_economia_3_6/main/data/regimen_tenencia_principal_v2.csv', function(error,data) {
        if (error) throw error;

        //Declaramos fuera las variables genéricas
        let margin = {top: 10, right: 10, bottom: 20, left: 32.5},
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

        let tickLabels = ['Total','16-29','30-44','45-64','65+'];

        let xAxis = function(g){
            g.call(d3.axisBottom(x).ticks(5).tickValues([0,2,3,4,5]).tickFormat((d,i) => tickLabels[i]));            
            svg.call(function(g){g.selectAll('.tick line').remove()});
            svg.call(function(g){g.selectAll('.domain').remove()});
        }
        
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);
        
        let y = d3.scaleLinear()
            .domain([0, 100])
            .range([height, 0]);

        let yAxis = function(svg) {
            svg.call(d3.axisLeft(y).ticks(5).tickFormat(function(d,i) { return numberWithCommas3(d); }));
            svg.call(function(g) {
                g.call(function(g){
                    g.selectAll('.tick line')
                        .attr('class', function(d,i) {
                            if (d == 0) {
                                return 'line-special';
                            }
                        })
                        .attr('x1', '0%')
                        .attr('x2', `${width}`)
                });
            });
        }

        svg.append("g")
            .attr("class", "yaxis")
            .call(yAxis);

        let color = d3.scaleOrdinal()
            .domain(gruposRegimen)
            .range([COLOR_PRIMARY_1, COLOR_ANAG_PRIM_1, COLOR_ANAG_PRIM_2, COLOR_ANAG_PRIM_3]);

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
                .attr("class", function(d,i) {
                    return 'serie serie-' + d.key;
                })
                .selectAll("rect")
                .data(function(d) { return d; })
                .enter()
                .append("rect")
                .attr('class','rect')
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
                .on('mouseover', function(d,i,e) {
                    //Opacidad en barras
                    let bars = svg.selectAll('.rect');
                    let parentElem = svg.select(`.${this.parentNode.classList.value.split(' ')[1]}`);
                    let childElems = parentElem.selectAll('.rect');            
            
                    bars.each(function() {
                        this.style.opacity = '0.4';
                    });
                    childElems.each(function() {
                        this.style.opacity = '1';
                    });

                    //Tooltip
                    let currentType = this.parentNode.classList.value.split(' ')[1];
                    let html = '<p class="chart__tooltip--title">' + dictionary[currentType.split('-')[1]] + '</p>' + 
                            '<p class="chart__tooltip--text">Este tipo de régimen de tenencia de la vivienda principal representa el <b>' + numberWithCommas3(d.data[currentType.split('-')[1]]) + '%</b> para este grupo de edad (<b>' + d.data.edad_2_persona_referencia + '</b>)</p>';
                    
                    tooltip.html(html);

                    //Tooltip
                    positionTooltip(window.event, tooltip);
                    getInTooltip(tooltip);
                })
                .on('mouseout', function(d,i,e) {
                    //Opacidad
                    let bars = svg.selectAll('.rect');
                    bars.each(function() {
                        this.style.opacity = '1';
                    });

                    //Quitamos el tooltip
                    getOutTooltip(tooltip);
                })
                .transition()
                .duration(2000)
                .attr("y", function(d) { return y(d[1]); })
                .attr("height", function(d) { return y(d[0]) - y(d[1]); });
        }

        function animateChart() {
            svg.selectAll('.rect')
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

            setTimeout(() => {
                setChartCanvas(); 
            }, 4000);
        });

        //////
        ///// Resto
        //////

        //Iframe
        setFixedIframeUrl('informe_perfil_mayores_2022_economia_3_6','distribucion_regimen_tenencia');

        //Redes sociales > Antes tenemos que indicar cuál sería el texto a enviar
        setRRSSLinks('distribucion_regimen_tenencia');

        //Captura de pantalla de la visualización
        setTimeout(() => {
            setChartCanvas(); 
        }, 4000);       

        let pngDownload = document.getElementById('pngImage');

        pngDownload.addEventListener('click', function(){
            setChartCanvasImage('distribucion_regimen_tenencia');
        });

        //Altura del frame
        setChartHeight();
    });    
}