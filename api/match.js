export const calculateMatch = (user, job) => {
     // Definir el peso para cada categoría como igual (20% para cada uno en total de 100%)
     const weight = 0.2;

     // Coincidencia de beneficios
     const userBenefits = new Set(user.benefits || []);
     const jobBenefits = new Set(job.benefits || []);
     const benefitsMatch = jobBenefits.size 
         ? [...jobBenefits].filter(benefit => userBenefits.has(benefit)).length / jobBenefits.size 
         : 0;
 
     // Coincidencia de conocimientos
     const userKnowledge = new Set(user.knoledge || []);
     const jobRequirements = new Set(job.requirements || []);
     const knowledgeMatch = jobRequirements.size 
         ? [...jobRequirements].filter(req => userKnowledge.has(req)).length / jobRequirements.size 
         : 0;
 
     // Coincidencia de idiomas
     const userLanguages = new Set(user.lenguages || []);
     const jobLanguages = new Set(job.lenguages || []);
     const languagesMatch = jobLanguages.size 
         ? [...jobLanguages].filter(lang => userLanguages.has(lang)).length / jobLanguages.size 
         : 1;
 
     // Coincidencia de sector
     const sectorMatch = user.sector === job.sector ? 1 : 0;
 
     // Coincidencia de modalidad de trabajo
     const userModalityPreference = "Remoto"; // Suponiendo que esta es la preferencia del usuario
     const jobModality = job.modJob.find(mod => mod.nombre === "Remoto")?.data || "";
     const modalityMatch = userModalityPreference === jobModality ? 1 : 0;
 
     // Log para depuración
     console.log(`benefitsMatch: ${benefitsMatch}, knowledgeMatch: ${knowledgeMatch}, languagesMatch: ${languagesMatch}, sectorMatch: ${sectorMatch}, modalityMatch: ${modalityMatch}`);
 
     // Cálculo del match total con igual peso para cada categoría
     const totalMatch = (
         benefitsMatch * weight +
         knowledgeMatch * weight +
         languagesMatch * weight +
         sectorMatch * weight +
         modalityMatch * weight
     );
 
     return totalMatch * 100;
 };
 