export const calcularMatch = (oferta, candidato) => {
    let score = 0;
    let totalWeight = 0;

    // Ponderaciones
    const pesoHabilidades = 40;
    const pesoExperiencia = 20;
    const pesoUbicacion = 15;
    const pesoEducacion = 15;
    const pesoDisponibilidad = 10;

    // Comparar habilidades
    const habilidadesComunes = candidato.habilidades.filter(habilidad => oferta.habilidades.includes(habilidad));
    const habilidadScore = (habilidadesComunes.length / oferta.habilidades.length) * pesoHabilidades;
    score += habilidadScore;
    totalWeight += pesoHabilidades;

    // Comparar experiencia (rango aceptable)
    let experienciaScore = 0;
    if (candidato.experiencia >= oferta.experienciaMinima && candidato.experiencia <= oferta.experienciaMaxima) {
        experienciaScore = pesoExperiencia;
    } else if (candidato.experiencia >= oferta.experienciaMinima) {
        const extraExperience = candidato.experiencia - oferta.experienciaMaxima;
        experienciaScore = Math.max(0, pesoExperiencia - extraExperience);
    }
    score += experienciaScore;
    totalWeight += pesoExperiencia;

    // Comparar ubicación (más flexible)
    const ubicacionScore = candidato.ubicacion.toLowerCase() === oferta.ubicacion.toLowerCase() ? pesoUbicacion : 0;
    score += ubicacionScore;
    totalWeight += pesoUbicacion;

    // Comparar educación (más detallado)
    const educacionScore = candidato.educacion.toLowerCase().includes(oferta.educacionRequerida.toLowerCase()) ? pesoEducacion : 0;
    score += educacionScore;
    totalWeight += pesoEducacion;

    // Comparar disponibilidad
    const disponibilidadScore = candidato.disponibilidad.toLowerCase() === oferta.disponibilidadRequerida.toLowerCase() ? pesoDisponibilidad : 0;
    score += disponibilidadScore;
    totalWeight += pesoDisponibilidad;

    // Convertir el puntaje a un porcentaje
    const porcentajeMatch = (score / totalWeight) * 100;
    return porcentajeMatch;

}