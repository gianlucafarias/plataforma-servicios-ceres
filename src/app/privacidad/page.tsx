import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad | Ceres en Red",
  description: "Política de privacidad del portal Ceres en Red de la Municipalidad de Ceres.",
};

const sections = [
  {
    title: "1. Responsable del tratamiento",
    content:
      "La Municipalidad de Ceres es la titular y responsable de las bases de datos del portal \"Ceres en Red\" y del tratamiento de los datos personales allí informados.",
  },
  {
    title: "2. Datos que se recopilan",
    content:
      "A través del uso del portal pueden recopilarse datos personales, laborales, académicos, societarios, antecedentes y otra información que los usuarios carguen voluntariamente al utilizar la plataforma.",
  },
  {
    title: "3. Carácter de la información declarada",
    content:
      "Toda la información ingresada por el usuario reviste carácter de declaración jurada. El usuario garantiza su veracidad, exactitud, integridad y vigencia. La Municipalidad no verifica ni certifica los datos ingresados por los usuarios.",
  },
  {
    title: "4. Finalidades del tratamiento",
    content:
      "Los datos serán utilizados para la gestión del portal, la intermediación laboral, la administración de perfiles y publicaciones, y la elaboración de estadísticas institucionales.",
  },
  {
    title: "5. Base legal y consentimiento",
    content:
      "El tratamiento se realiza conforme a la Ley N° 25.326 de Protección de Datos Personales y normativa complementaria. Al utilizar el portal, el usuario presta consentimiento libre, expreso e informado para el tratamiento de sus datos con las finalidades indicadas.",
  },
  {
    title: "6. Publicación y acceso por terceros",
    content:
      "El usuario acepta que parte de la información cargada podrá ser publicada en el portal y en canales institucionales, y podrá ser visualizada, consultada y/o utilizada por terceros, incluyendo empleadores, instituciones y público en general.",
  },
  {
    title: "7. Uso institucional de la información",
    content:
      "El usuario autoriza a la Municipalidad de Ceres a utilizar, almacenar, procesar, reproducir y difundir la información suministrada con fines institucionales y de promoción de actividades, incluyendo su publicación en medios digitales, redes sociales y material gráfico o audiovisual, sin derecho a compensación económica.",
  },
  {
    title: "8. Conservación y seguridad",
    content:
      "Los datos se incorporan a bases de datos de titularidad de la Municipalidad de Ceres. Si bien se aplican medidas de resguardo, no se garantiza seguridad absoluta en transmisiones por Internet, por lo que el usuario reconoce y asume los riesgos inherentes al uso de medios digitales.",
  },
  {
    title: "9. Cookies",
    content:
      "El portal puede utilizar cookies con fines operativos y estadísticos. La utilización del sitio implica la aceptación de este uso.",
  },
  {
    title: "10. Derechos de los titulares",
    content:
      "El titular de los datos podrá ejercer los derechos de acceso, rectificación y supresión conforme a la normativa vigente. La Agencia de Acceso a la Información Pública es el órgano de control de la Ley N° 25.326.",
  },
  {
    title: "11. Reclamos y vía administrativa previa",
    content:
      "Toda solicitud de rectificación, supresión, reclamo o cuestionamiento relacionado con datos personales deberá plantearse en forma previa ante la Municipalidad de Ceres, por Mesa de Entrada o por los canales electrónicos habilitados, hasta agotar la instancia administrativa correspondiente.",
  },
  {
    title: "12. Cambios a esta política",
    content:
      "La Municipalidad de Ceres podrá modificar o actualizar esta política en cualquier momento. Las modificaciones se considerarán vigentes desde su publicación en el sitio web oficial.",
  },
  {
    title: "13. Ley aplicable y jurisdicción",
    content:
      "Esta política se rige por las leyes de la República Argentina. Para cualquier controversia, las partes se someten a la jurisdicción de los Tribunales Ordinarios competentes de la Provincia de Santa Fe, con competencia territorial en la ciudad de Ceres.",
  },
];

export default function PrivacidadPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 md:py-16">
      <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
        Política de Privacidad
      </h1>
      <p className="mb-8 text-sm text-gray-600 dark:text-gray-400 md:text-base">
        Portal &quot;Ceres en Red&quot; - Municipalidad de Ceres
      </p>

      <section className="space-y-6 text-sm leading-relaxed text-gray-700 dark:text-gray-300 md:text-base">
        {sections.map((section) => (
          <article key={section.title} className="space-y-2">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white md:text-lg">
              {section.title}
            </h2>
            <p>{section.content}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
