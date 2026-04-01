
// ============================================================================
// VARIABLES GLOBALES
// ============================================================================

var anim;                           // Animación principal (gráficas)
var animUbicador;                   // Animación del ubicador
var animBarraInferior;              // Animación de fondo (data_1.json)
var currentGraphic = null;          // Número de gráfica actual cargada
var isTransitioning = false;        // Evita clicks múltiples durante transición
var ubicadorLoaded = false;         // Indica si el ubicador ya fue cargado
var ubicadorVisible = false;        // Indica si el ubicador está visible
var barraInferiorLoaded = false;    // Indica si la barra inferior ya fue cargada
var barraInferiorVisible = false;   // Indica si la barra inferior está visible

// ============================================================================
// FUNCIONES PRINCIPALES DE CARGA
// ============================================================================

/**
 * Carga una nueva gráfica con transición
 * @param {number} graphicNumber - Número de la gráfica (1, 2, 3, 4, 5, etc.)
 */
function loadGraphic(graphicNumber) {
    if (isTransitioning) return;
    if (currentGraphic === graphicNumber) return;

    isTransitioning = true;

    if (currentGraphic !== null && anim) {
        // HAY GRÁFICA CARGADA: Hacer reverse primero
        checkBothGraphicsAndHandleBarraInferior(currentGraphic, graphicNumber);
        
        anim.setDirection(-1);
        anim.play();
        
        anim.addEventListener('complete', function onReverseComplete() {
            anim.removeEventListener('complete', onReverseComplete);
            checkGraphicAndShowElements(graphicNumber);
            loadNewGraphic(graphicNumber);
        });
    } else {
        // NO HAY GRÁFICA: Cargar directamente
        checkGraphicAndShowElements(graphicNumber);
        loadNewGraphic(graphicNumber);
    }
}

/**
 * Carga físicamente la nueva gráfica en el contenedor
 * @param {number} graphicNumber - Número de la gráfica
 */
function loadNewGraphic(graphicNumber) {
    if (anim) {
        anim.destroy();
    }

    var params = {
        container: document.getElementById('lottie'),
        renderer: 'svg',
        loop: false,
        autoplay: false,
        path: './json/data_' + graphicNumber + '.json'
    };

    anim = lottie.loadAnimation(params);

    anim.addEventListener('DOMLoaded', function() {
        currentGraphic = graphicNumber;
        anim.setDirection(1);
        anim.play();
        isTransitioning = false;
    });
}
lottiePlayer
// ============================================================================
// FUNCIONES DE DETECCIÓN Y LÓGICA
// ============================================================================

/**
 * Verifica AMBAS gráficas (actual y nueva) y decide qué elementos ocultar
 * Esta función se ejecuta DURANTE el reverse (sincronizado)
 * 
 * @param {number} currentGraphicNum - Gráfica actual
 * @param {number} newGraphicNum - Gráfica nueva
 */
function checkBothGraphicsAndHandleBarraInferior(currentGraphicNum, newGraphicNum) {
    Promise.all([
        fetch('./json/data_' + currentGraphicNum + '.json').then(r => r.json()),
        fetch('./json/data_' + newGraphicNum + '.json').then(r => r.json())
    ]).then(([currentData, newData]) => {
        var currentIsCreditos = isGraphicCreditos(currentData);
        var newIsCreditos = isGraphicCreditos(newData);
        var currentHasBarraInferior = hasBarraInferiorLayer(currentData);
        var newHasBarraInferior = hasBarraInferiorLayer(newData);
        
        console.log('Transición: Actual=' + currentGraphicNum + 
                    ' (isCreditos:' + currentIsCreditos + ', hasBarraInferior:' + currentHasBarraInferior + 
                    ') -> Nueva=' + newGraphicNum + 
                    ' (isCreditos:' + newIsCreditos + ', hasBarraInferior:' + newHasBarraInferior + ')');
        
        // LÓGICA BARRA INFERIOR: Sacar si actual ES CREDITOS pero nueva NO ES CREDITOS
        if (currentIsCreditos && !newIsCreditos && barraInferiorVisible) {
            console.log('Sacando barra inferior (transición de CREDITOS a NO-CREDITOS)');
            hideBarraInferior();
        }
        
        // LÓGICA UBICADOR: Sacar si nueva NO tiene barra_inferior Y NO es CREDITOS
        if (!newHasBarraInferior && !newIsCreditos && ubicadorVisible) {
            console.log('Sacando ubicador (nueva gráfica no compatible)');
            takeOutUbicador();
        }
    }).catch(error => {
        console.error('Error al verificar gráficas:', error);
    });
}

/**
 * Verifica la NUEVA gráfica y decide qué elementos mostrar
 * Esta función se ejecuta DESPUÉS del reverse
 * 
 * @param {number} graphicNumber - Número de la nueva gráfica
 */
function checkGraphicAndShowElements(graphicNumber) {
    fetch('./json/data_' + graphicNumber + '.json')
        .then(response => response.json())
        .then(data => {
            var isCreditos = isGraphicCreditos(data);
            
            console.log('Gráfico nuevo ' + graphicNumber + ' - isCreditos:', isCreditos);

            // LÓGICA BARRA INFERIOR: Mostrar si es CREDITOS
            if (isCreditos && !barraInferiorVisible) {
                showBarraInferior();
            }
        })
        .catch(error => {
            console.error('Error al verificar el gráfico:', error);
        });
}

// ============================================================================
// FUNCIONES AUXILIARES DE DETECCIÓN
// ============================================================================

/**
 * Verifica si una gráfica es de tipo CREDITOS
 * @param {Object} data - Datos JSON de la gráfica
 * @returns {boolean}
 */
function isGraphicCreditos(data) {
    // Verificar en el nombre del JSON (root level)
    if (data.nm && data.nm.startsWith("CREDITOS")) {
        return true;
    }
    
    // Verificar en las capas
    if (data.layers) {
        for (var i = 0; i < data.layers.length; i++) {
            if (data.layers[i].nm && data.layers[i].nm.startsWith("CREDITOS")) {
                return true;
            }
        }
    }
    
    return false;
}

/**
 * Verifica si una gráfica tiene capa "barra_inferior"
 * @param {Object} data - Datos JSON de la gráfica
 * @returns {boolean}
 */
function hasBarraInferiorLayer(data) {
    if (data.layers) {
        for (var i = 0; i < data.layers.length; i++) {
            if (data.layers[i].nm === "barra_inferior") {
                return true;
            }
        }
    }
    return false;
}

// ============================================================================
// FUNCIONES DE BARRA INFERIOR (FONDO)
// ============================================================================

/**
 * Muestra la barra inferior (data_1.json) como fondo
 */
function showBarraInferior() {
    console.log('showBarraInferior llamado - barraInferiorLoaded:', barraInferiorLoaded, 'barraInferiorVisible:', barraInferiorVisible);
    
    if (barraInferiorLoaded && animBarraInferior) {
        console.log('Barra inferior ya cargada, reproduciendo...');
        animBarraInferior.setDirection(1);
        animBarraInferior.play();
        barraInferiorVisible = true;
        return;
    }

    console.log('Cargando barra inferior por primera vez...');
    var container = document.getElementById('lottie-barra-inferior');
    
    var paramsBarraInferior = {
        container: container,
        renderer: 'svg',
        loop: false,
        autoplay: false,
        path: './json/data_1.json'
    };

    animBarraInferior = lottie.loadAnimation(paramsBarraInferior);

    animBarraInferior.addEventListener('DOMLoaded', function() {
        console.log('Barra inferior cargada exitosamente');
        barraInferiorLoaded = true;
        barraInferiorVisible = true;
        animBarraInferior.setDirection(1);
        animBarraInferior.play();
    });
}

/**
 * Oculta la barra inferior con animación reverse
 */
function hideBarraInferior() {
    if (animBarraInferior && barraInferiorLoaded && barraInferiorVisible) {
        animBarraInferior.setDirection(-1);
        animBarraInferior.play();
        barraInferiorVisible = false;
    }
}

// ============================================================================
// FUNCIONES DE CONTROL MANUAL
// ============================================================================

/**
 * Reproduce la animación actual en dirección normal
 */
function playAnimation() {
    if (anim && currentGraphic !== null) {
        anim.setDirection(1);
        //  anim.play();
       anim.playSegments([0, 12], true);
    }
}

/**
 * Saca la animación actual con reverse (botón "Take Out")
 */
function continuar() {
    if (anim && currentGraphic !== null) {
        anim.setDirection(-1);
        anim.play();
        
        // Si es CREDITOS, también sacar la barra inferior
        fetch('./json/data_' + currentGraphic + '.json')
            .then(response => response.json())
            .then(data => {
                if (isGraphicCreditos(data) && barraInferiorVisible) {
                    hideBarraInferior();
                }
            })
            .catch(error => {
                console.error('Error al verificar gráfico en continuar:', error);
            });
    }
}

// ============================================================================
// FUNCIONES DEL UBICADOR (INDEPENDIENTE)
// ============================================================================

/**
 * Muestra el ubicador (frames 0-24, pausa automática)
 */
function takeUbicador() {
    if (ubicadorLoaded && animUbicador) {

        // Play normal 
        // animUbicador.setDirection(1);
        // animUbicador.play();

        // Play con segmentos (0-24)
        animUbicador.playSegments([0, 24], true);
        ubicadorVisible = true;
        return;
    }

    var paramsUbicador = {
        container: document.getElementById('lottie-ubicador'),
        renderer: 'svg',
        loop: false,
        autoplay: false,
        path: './json/misa.json'
    };

    animUbicador = lottie.loadAnimation(paramsUbicador);

    animUbicador.addEventListener('DOMLoaded', function() {
        ubicadorLoaded = true;
        ubicadorVisible = true;

        // Play normal con reverse 
        // animUbicador.setDirection(1);
        // animUbicador.play();
        // Play con segmentos (0-24)  -- 1 segundo
        animUbicador.playSegments([0, 24], true);
    });
}

/**
 * Saca el ubicador (frames 24-34, continúa la animación)
 */
function takeOutUbicador() {
    if (animUbicador && ubicadorLoaded && ubicadorVisible) {
        //  Continuar animacion con segmentos (24-36) --medio segundo
        animUbicador.playSegments([24, 36], true);
        // Salir con Reverse 
        // animUbicador.setDirection(-1);
        // animUbicador.play();
        ubicadorVisible = false;
    }
}
