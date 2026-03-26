  var anim;
    var animUbicador; // Animación separada para el ubicador
    var currentGraphic = null; // Guarda el gráfico actual cargado
    var isTransitioning = false; // Evita múltiples transiciones simultáneas
    var ubicadorLoaded = false; // Estado del ubicador

    // Función para cargar un gráfico
    function loadGraphic(graphicNumber) {
        if (isTransitioning) return; // Evita clicks múltiples durante transición

        // Si ya está cargado el mismo gráfico, no hacer nada
        if (currentGraphic === graphicNumber) return;

        isTransitioning = true;

        // Si hay un gráfico cargado, hacer reverse primero
        if (currentGraphic !== null && anim) {
            anim.setDirection(-1); // Reverse
            anim.play();
            
            // Esperar a que termine el reverse antes de cargar el nuevo
            anim.addEventListener('complete', function onReverseComplete() {
                anim.removeEventListener('complete', onReverseComplete);
                loadNewGraphic(graphicNumber);
            });
        } else {
            // No hay gráfico cargado, cargar directamente
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
        }
    }

    // Funciones para el ubicador (independiente de los gráficos)
    function takeUbicador() {
        if (ubicadorLoaded && animUbicador) {
            // Si ya está cargado, solo reproducir
            animUbicador.setDirection(1);
            animUbicador.play();
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
            animUbicador.setDirection(1);
            animUbicador.play();
        });
    }

    function takeOutUbicador() {
        if (animUbicador && ubicadorLoaded) {
            animUbicador.setDirection(-1); // Reverse
            animUbicador.play();
        }
    }
