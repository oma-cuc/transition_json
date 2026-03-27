  var anim;
    var animUbicador; // Animación separada para el ubicador
    var animBarraInferior; // Animación de fondo (data_1.json)
    var currentGraphic = null; // Guarda el gráfico actual cargado
    var isTransitioning = false; // Evita múltiples transiciones simultáneas
    var ubicadorLoaded = false; // Estado del ubicador
    var ubicadorVisible = false; // Indica si el ubicador está visible
    var barraInferiorLoaded = false; // Estado de la barra inferior
    var barraInferiorVisible = false; // Indica si la barra inferior está visible

    // Función para cargar un gráfico
    function loadGraphic(graphicNumber) {
        if (isTransitioning) return; // Evita clicks múltiples durante transición

        // Si ya está cargado el mismo gráfico, no hacer nada
        if (currentGraphic === graphicNumber) return;

        isTransitioning = true;

        // Si hay un gráfico cargado, hacer reverse primero
        if (currentGraphic !== null && anim) {
            // Verificar AMBAS gráficas para decidir qué hacer con la barra inferior
            checkBothGraphicsAndHandleBarraInferior(currentGraphic, graphicNumber);
            
            anim.setDirection(-1); // Reverse
            anim.play();
            
            // Esperar a que termine el reverse antes de cargar el nuevo
            anim.addEventListener('complete', function onReverseComplete() {
                anim.removeEventListener('complete', onReverseComplete);
                // DESPUÉS del reverse, verificar si el NUEVO gráfico necesita elementos
                checkGraphicAndShowElements(graphicNumber);
                loadNewGraphic(graphicNumber);
            });
        } else {
            // No hay gráfico cargado, verificar y cargar directamente
            checkGraphicAndShowElements(graphicNumber);
            loadNewGraphic(graphicNumber);
        }
    }

    // Función auxiliar para cargar el nuevo gráfico
    function loadNewGraphic(graphicNumber) {
        // Destruir la animación anterior si existe
        if (anim) {
            anim.destroy();
        }

        // Configurar la nueva animación
        var params = {
            container: document.getElementById('lottie'),
            renderer: 'svg',
            loop: false,
            autoplay: false,
            path: './json/data_' + graphicNumber + '.json'
        };

        anim = lottie.loadAnimation(params);

        // Cuando la animación esté lista, reproducirla
        anim.addEventListener('DOMLoaded', function() {
            currentGraphic = graphicNumber;
            anim.setDirection(1); // Dirección normal
            anim.play();
            isTransitioning = false;
        });
    }

    // Función para verificar AMBAS gráficas y decidir qué hacer con la barra inferior
    function checkBothGraphicsAndHandleBarraInferior(currentGraphicNum, newGraphicNum) {
        // Cargar ambos JSONs
        Promise.all([
            fetch('./json/data_' + currentGraphicNum + '.json').then(r => r.json()),
            fetch('./json/data_' + newGraphicNum + '.json').then(r => r.json())
        ]).then(([currentData, newData]) => {
            var currentIsCreditos = false;
            var newIsCreditos = false;
            var currentHasBarraInferior = false;
            var newHasBarraInferior = false;
            
            // Verificar gráfica ACTUAL
            if (currentData.nm && currentData.nm.startsWith("CREDITOS")) {
                currentIsCreditos = true;
            }
            if (currentData.layers) {
                for (var i = 0; i < currentData.layers.length; i++) {
                    var layerName = currentData.layers[i].nm;
                    if (layerName && layerName.startsWith("CREDITOS")) {
                        currentIsCreditos = true;
                    }
                    if (layerName === "barra_inferior") {
                        currentHasBarraInferior = true;
                    }
                }
            }
            
            // Verificar gráfica NUEVA
            if (newData.nm && newData.nm.startsWith("CREDITOS")) {
                newIsCreditos = true;
            }
            if (newData.layers) {
                for (var i = 0; i < newData.layers.length; i++) {
                    var layerName = newData.layers[i].nm;
                    if (layerName && layerName.startsWith("CREDITOS")) {
                        newIsCreditos = true;
                    }
                    if (layerName === "barra_inferior") {
                        newHasBarraInferior = true;
                    }
                }
            }
            
            console.log('Transición: Actual=' + currentGraphicNum + ' (isCreditos:' + currentIsCreditos + ', hasBarraInferior:' + currentHasBarraInferior + ') -> Nueva=' + newGraphicNum + ' (isCreditos:' + newIsCreditos + ', hasBarraInferior:' + newHasBarraInferior + ')');
            
            // LÓGICA BARRA INFERIOR: Solo sacar si la actual ES CREDITOS pero la nueva NO ES CREDITOS
            if (currentIsCreditos && !newIsCreditos && barraInferiorVisible) {
                console.log('Sacando barra inferior porque nueva gráfica NO es CREDITOS');
                hideBarraInferior();
            }
            
            // LÓGICA UBICADOR: Sacar si la nueva NO tiene barra_inferior Y NO es CREDITOS
            if (!newHasBarraInferior && !newIsCreditos && ubicadorVisible) {
                console.log('Sacando ubicador porque nueva gráfica NO tiene barra_inferior ni es CREDITOS');
                takeOutUbicador();
            }
            
            // Si ambas son CREDITOS, la barra inferior permanece
            // Si la actual NO es CREDITOS, no hay nada que sacar
        }).catch(error => {
            console.error('Error al verificar gráficas:', error);
        });
    }

    // Función para verificar la gráfica ACTUAL y ocultar elementos si es necesario
    function checkCurrentGraphicAndHideElements() {
        if (currentGraphic === null) return;
        
        // Cargar el JSON de la gráfica ACTUAL para verificar su tipo
        fetch('./json/data_' + currentGraphic + '.json')
            .then(response => response.json())
            .then(data => {
                var isCreditos = false;
                
                // Verificar el nombre del JSON completo
                if (data.nm && data.nm.startsWith("CREDITOS")) {
                    isCreditos = true;
                }
                
                // Verificar en las capas
                if (data.layers) {
                    for (var i = 0; i < data.layers.length; i++) {
                        if (data.layers[i].nm && data.layers[i].nm.startsWith("CREDITOS")) {
                            isCreditos = true;
                            break;
                        }
                    }
                }

                console.log('Gráfico actual ' + currentGraphic + ' saliendo - isCreditos:', isCreditos);

                // Si la gráfica actual es CREDITOS, sacar la barra inferior
                if (isCreditos && barraInferiorVisible) {
                    hideBarraInferior();
                }
            })
            .catch(error => {
                console.error('Error al verificar gráfico actual:', error);
            });
    }

    // Función para verificar el NUEVO gráfico y mostrar elementos si es necesario
    function checkGraphicAndShowElements(graphicNumber) {
        // Cargar el JSON para verificar su tipo
        fetch('./json/data_' + graphicNumber + '.json')
            .then(response => response.json())
            .then(data => {
                var isCreditos = false;
                
                // Verificar el nombre del JSON completo (root level)
                if (data.nm && data.nm.startsWith("CREDITOS")) {
                    isCreditos = true;
                }
                
                // Buscar en las capas el tipo de gráfico
                if (data.layers) {
                    for (var i = 0; i < data.layers.length; i++) {
                        var layerName = data.layers[i].nm;
                        
                        // Verificar si es un gráfico de CREDITOS (también en capas)
                        if (layerName && layerName.startsWith("CREDITOS")) {
                            isCreditos = true;
                        }
                    }
                }

                console.log('Gráfico nuevo ' + graphicNumber + ' - isCreditos:', isCreditos);

                // LÓGICA PARA BARRA INFERIOR (data_1.json como fondo)
                // REGLA SIMPLE: Solo mostrar barra inferior de fondo si es CREDITOS
                if (isCreditos) {
                    // Es CREDITOS → Mostrar barra inferior de fondo
                    if (!barraInferiorVisible) {
                        showBarraInferior();
                    }
                }
                // NO sacar la barra inferior aquí, eso se maneja en checkBothGraphicsAndHandleBarraInferior
            })
            .catch(error => {
                console.error('Error al verificar el gráfico:', error);
            });
    }

    // Función LEGACY - mantener por compatibilidad
    function checkGraphicAndHandleElements(graphicNumber) {
        checkGraphicAndShowElements(graphicNumber);
    }

    // Función para mostrar la barra inferior (data_1.json) como fondo
    function showBarraInferior() {
        console.log('showBarraInferior llamado - barraInferiorLoaded:', barraInferiorLoaded, 'barraInferiorVisible:', barraInferiorVisible);
        
        if (barraInferiorLoaded && animBarraInferior) {
            // Si ya está cargada, solo reproducir
            console.log('Barra inferior ya cargada, reproduciendo...');
            animBarraInferior.setDirection(1);
            animBarraInferior.play();
            barraInferiorVisible = true;
            return;
        }

        // Cargar la barra inferior por primera vez
        console.log('Cargando barra inferior por primera vez...');
        var container = document.getElementById('lottie-barra-inferior');
        console.log('Contenedor encontrado:', container);
        
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
        
        animBarraInferior.addEventListener('data_failed', function(error) {
            console.error('Error al cargar barra inferior:', error);
        });
    }

    function hideBarraInferior() {
        if (animBarraInferior && barraInferiorLoaded && barraInferiorVisible) {
            animBarraInferior.setDirection(-1); // Reverse
            animBarraInferior.play();
            barraInferiorVisible = false;
        }
    }

    // Funciones para controlar la animación manualmente
    function playAnimation() {
        if (anim && currentGraphic !== null) {
            anim.setDirection(1); // Dirección normal
            anim.play();
        }
    }

    function continuar() {
        if (anim && currentGraphic !== null) {
            anim.setDirection(-1); // Dirección reversa
            anim.play();
            
            // Verificar si la gráfica actual es CREDITOS y sacar la barra inferior
            fetch('./json/data_' + currentGraphic + '.json')
                .then(response => response.json())
                .then(data => {
                    var isCreditos = false;
                    
                    // Verificar el nombre del JSON completo
                    if (data.nm && data.nm.startsWith("CREDITOS")) {
                        isCreditos = true;
                    }
                    
                    // Verificar en las capas
                    if (data.layers) {
                        for (var i = 0; i < data.layers.length; i++) {
                            if (data.layers[i].nm && data.layers[i].nm.startsWith("CREDITOS")) {
                                isCreditos = true;
                                break;
                            }
                        }
                    }
                    
                    // Si es CREDITOS, sacar la barra inferior
                    if (isCreditos && barraInferiorVisible) {
                        hideBarraInferior();
                    }
                })
                .catch(error => {
                    console.error('Error al verificar gráfico en continuar:', error);
                });
        }
    }

    // Funciones para el ubicador (independiente de los gráficos)
    function takeUbicador() {
        if (ubicadorLoaded && animUbicador) {
            // Si ya está cargado, solo reproducir
            animUbicador.setDirection(1);
            animUbicador.play();
            ubicadorVisible = true;
            return;
        }

        // Cargar el ubicador por primera vez en su propio contenedor
        var paramsUbicador = {
            container: document.getElementById('lottie-ubicador'),
            renderer: 'svg',
            loop: false,
            autoplay: false,
            path: './json/ubicador.json'
        };

        animUbicador = lottie.loadAnimation(paramsUbicador);

        animUbicador.addEventListener('DOMLoaded', function() {
            ubicadorLoaded = true;
            ubicadorVisible = true;
            animUbicador.setDirection(1);
            animUbicador.play();
        });
    }

    function takeOutUbicador() {
        if (animUbicador && ubicadorLoaded && ubicadorVisible) {
            animUbicador.setDirection(-1); // Reverse
            animUbicador.play();
            ubicadorVisible = false;
        }
    }
