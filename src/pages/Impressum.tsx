import { Helmet } from "react-helmet-async";
import Layout from "@/components/layout/Layout";

const Impressum = () => {
  return (
    <Layout>
      <Helmet>
        <title>Impressum & Datenschutz – Erinnerlich</title>
        <meta name="description" content="Impressum und Datenschutzerklärung von Erinnerlich – Das Trauerportal für Deutschland." />
      </Helmet>

      <div className="container max-w-3xl py-12 md:py-16">
        {/* Impressum */}
        <h1 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-10">
          Impressum
        </h1>

        <section className="prose prose-neutral dark:prose-invert max-w-none space-y-4 text-foreground/90 text-sm leading-relaxed">
          <h2 className="font-serif text-xl font-semibold text-foreground mt-0">Angaben gemäß § 5 TMG</h2>
          <p>
            Mario Kraus<br />
            AGILE MASTERS<br />
            Kreuzerweg 6<br />
            85368 Wang<br />
            Deutschland
          </p>

          <h2 className="font-serif text-xl font-semibold text-foreground">Kontakt</h2>
          <p>
            Telefon: +49 151-12589814<br />
            E-Mail: mario.kraus@agile-masters.de
          </p>

          <h2 className="font-serif text-xl font-semibold text-foreground">Umsatzsteuer-ID</h2>
          <p>
            Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz:<br />
            Wird auf Anfrage mitgeteilt.
          </p>

          <h2 className="font-serif text-xl font-semibold text-foreground">Redaktionell verantwortlich</h2>
          <p>
            Mario Kraus<br />
            Kreuzerweg 6<br />
            85368 Wang
          </p>
          <p className="text-xs text-muted-foreground">
            (Verantwortlich nach § 18 Abs. 2 MStV)
          </p>

          <h2 className="font-serif text-xl font-semibold text-foreground">EU-Streitschlichtung</h2>
          <p>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
            <a
              href="https://ec.europa.eu/consumers/odr/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              https://ec.europa.eu/consumers/odr/
            </a>
            .<br />
            Unsere E-Mail-Adresse finden Sie oben im Impressum.
          </p>

          <p>
            Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </section>

        {/* Divider */}
        <hr className="my-12 border-border" />

        {/* Datenschutzerklärung */}
        <h2 className="font-serif text-3xl md:text-4xl font-medium text-foreground mb-10">
          Datenschutz&shy;erklärung
        </h2>

        <section className="prose prose-neutral dark:prose-invert max-w-none space-y-4 text-foreground/90 text-sm leading-relaxed">
          {/* 1. Verantwortlicher */}
          <h3 className="font-serif text-lg font-semibold text-foreground mt-0">1. Verantwortlicher</h3>
          <p>
            Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
          </p>
          <p>
            Mario Kraus<br />
            AGILE MASTERS<br />
            Kreuzerweg 6<br />
            85368 Wang, Deutschland<br />
            Telefon: +49 151-12589814<br />
            E-Mail: mario.kraus@agile-masters.de
          </p>

          {/* 2. Hosting */}
          <h3 className="font-serif text-lg font-semibold text-foreground">2. Hosting</h3>
          <p>
            Unsere Website wird bei einem externen Dienstleister gehostet (Hoster). Die personenbezogenen
            Daten, die auf dieser Website erfasst werden, werden auf den Servern des Hosters gespeichert.
            Hierbei kann es sich v.&nbsp;a. um IP-Adressen, Kontaktanfragen, Meta- und Kommunikationsdaten,
            Vertragsdaten, Kontaktdaten, Namen, Websitezugriffe und sonstige Daten, die über eine Website
            generiert werden, handeln.
          </p>
          <p>
            Der Einsatz des Hosters erfolgt im Interesse einer sicheren, schnellen und effizienten
            Bereitstellung unseres Online-Angebots durch einen professionellen Anbieter (Art. 6 Abs. 1
            lit. f DSGVO).
          </p>

          {/* 3. Allgemeine Hinweise */}
          <h3 className="font-serif text-lg font-semibold text-foreground">3. Allgemeine Hinweise und Pflichtinformationen</h3>

          <h4 className="font-semibold text-foreground">SSL- bzw. TLS-Verschlüsselung</h4>
          <p>
            Diese Seite nutzt aus Sicherheitsgründen eine SSL- bzw. TLS-Verschlüsselung. Eine
            verschlüsselte Verbindung erkennen Sie daran, dass die Adresszeile des Browsers von
            „http://" auf „https://" wechselt und an dem Schloss-Symbol in Ihrer Browserzeile.
            Wenn die SSL- bzw. TLS-Verschlüsselung aktiviert ist, können die Daten, die Sie an uns
            übermitteln, nicht von Dritten mitgelesen werden.
          </p>

          <h4 className="font-semibold text-foreground">Cookies</h4>
          <p>
            Unsere Internetseiten verwenden teilweise so genannte Cookies. Cookies richten auf Ihrem
            Rechner keinen Schaden an und enthalten keine Viren. Cookies dienen dazu, unser Angebot
            nutzerfreundlicher, effektiver und sicherer zu machen. Cookies sind kleine Textdateien, die
            auf Ihrem Rechner abgelegt werden und die Ihr Browser speichert.
          </p>
          <p>
            Die meisten der von uns verwendeten Cookies sind so genannte „Session-Cookies". Sie werden
            nach Ende Ihres Besuchs automatisch gelöscht. Andere Cookies bleiben auf Ihrem Endgerät
            gespeichert, bis Sie diese löschen. Diese Cookies ermöglichen es uns, Ihren Browser beim
            nächsten Besuch wiederzuerkennen.
          </p>
          <p>
            Sie können Ihren Browser so einstellen, dass Sie über das Setzen von Cookies informiert
            werden und Cookies nur im Einzelfall erlauben, die Annahme von Cookies für bestimmte Fälle
            oder generell ausschließen sowie das automatische Löschen der Cookies beim Schließen des
            Browsers aktivieren. Bei der Deaktivierung von Cookies kann die Funktionalität dieser Website
            eingeschränkt sein.
          </p>

          <h4 className="font-semibold text-foreground">Kontaktformular</h4>
          <p>
            Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben aus dem
            Anfrageformular inklusive der von Ihnen dort angegebenen Kontaktdaten zwecks Bearbeitung der
            Anfrage und für den Fall von Anschlussfragen bei uns gespeichert. Diese Daten geben wir nicht
            ohne Ihre Einwilligung weiter. Die Verarbeitung dieser Daten erfolgt auf Grundlage von
            Art. 6 Abs. 1 lit. b DSGVO.
          </p>

          <h4 className="font-semibold text-foreground">Anfrage per E-Mail oder Telefon</h4>
          <p>
            Wenn Sie uns per E-Mail oder Telefon kontaktieren, wird Ihre Anfrage inklusive aller daraus
            hervorgehenden personenbezogenen Daten (Name, Anfrage) zum Zwecke der Bearbeitung Ihres
            Anliegens bei uns gespeichert und verarbeitet. Diese Daten geben wir nicht ohne Ihre
            Einwilligung weiter. Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO.
          </p>

          {/* 4. Kondolenzen & Kerzen */}
          <h3 className="font-serif text-lg font-semibold text-foreground">4. Kondolenzen und Kerzen</h3>
          <p>
            Auf unserer Website haben Besucher die Möglichkeit, Kondolenzen und virtuelle Kerzen zu
            hinterlassen. Dabei werden folgende Daten erhoben: Name, ggf. E-Mail-Adresse sowie der
            eingegebene Text. Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO
            (Einwilligung) sowie Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Darstellung
            des Gedenkens). E-Mail-Adressen werden nicht öffentlich angezeigt.
          </p>

          {/* 5. Analyse-Tools */}
          <h3 className="font-serif text-lg font-semibold text-foreground">5. Analyse-Tools</h3>
          <p>
            Wir setzen derzeit keine Analyse- oder Tracking-Tools (wie z.&nbsp;B. Google Analytics)
            ein. Sollte sich dies ändern, werden wir diese Datenschutzerklärung entsprechend aktualisieren
            und ggf. Ihre Einwilligung einholen.
          </p>

          {/* 6. Betroffenenrechte */}
          <h3 className="font-serif text-lg font-semibold text-foreground">6. Ihre Rechte als betroffene Person</h3>

          <h4 className="font-semibold text-foreground">Recht auf Auskunft (Art. 15 DSGVO)</h4>
          <p>
            Sie haben das Recht, eine Bestätigung darüber zu verlangen, ob personenbezogene Daten
            verarbeitet werden. Ist dies der Fall, haben Sie ein Recht auf Auskunft über diese Daten
            und auf weitere Informationen gemäß Art. 15 DSGVO.
          </p>

          <h4 className="font-semibold text-foreground">Recht auf Berichtigung (Art. 16 DSGVO)</h4>
          <p>
            Sie haben das Recht, die Berichtigung unrichtiger oder die Vervollständigung
            unvollständiger personenbezogener Daten zu verlangen.
          </p>

          <h4 className="font-semibold text-foreground">Recht auf Löschung (Art. 17 DSGVO)</h4>
          <p>
            Sie haben das Recht, die Löschung Ihrer personenbezogenen Daten zu verlangen, sofern die
            gesetzlichen Voraussetzungen vorliegen.
          </p>

          <h4 className="font-semibold text-foreground">Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</h4>
          <p>
            Sie haben das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu
            verlangen, wenn die gesetzlichen Voraussetzungen gegeben sind.
          </p>

          <h4 className="font-semibold text-foreground">Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</h4>
          <p>
            Sie haben das Recht, die Sie betreffenden personenbezogenen Daten in einem strukturierten,
            gängigen und maschinenlesbaren Format zu erhalten oder die Übermittlung an einen anderen
            Verantwortlichen zu verlangen.
          </p>

          <h4 className="font-semibold text-foreground">Widerspruchsrecht (Art. 21 DSGVO)</h4>
          <p>
            Sie haben das Recht, aus Gründen, die sich aus Ihrer besonderen Situation ergeben, jederzeit
            gegen die Verarbeitung Ihrer personenbezogenen Daten Widerspruch einzulegen, sofern die
            Verarbeitung auf Art. 6 Abs. 1 lit. e oder f DSGVO beruht.
          </p>

          <h4 className="font-semibold text-foreground">Recht auf Widerruf einer Einwilligung (Art. 7 Abs. 3 DSGVO)</h4>
          <p>
            Sofern die Verarbeitung auf Ihrer Einwilligung beruht, haben Sie das Recht, diese jederzeit
            zu widerrufen. Die Rechtmäßigkeit der aufgrund der Einwilligung bis zum Widerruf erfolgten
            Verarbeitung wird dadurch nicht berührt.
          </p>

          <h4 className="font-semibold text-foreground">Beschwerderecht bei einer Aufsichtsbehörde (Art. 77 DSGVO)</h4>
          <p>
            Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren, wenn Sie der
            Ansicht sind, dass die Verarbeitung Ihrer personenbezogenen Daten rechtswidrig erfolgt. Die
            zuständige Aufsichtsbehörde richtet sich nach dem Bundesland Ihres Wohnsitzes, Arbeitsplatzes
            oder des Orts der mutmaßlichen Verletzung. Eine Liste der Aufsichtsbehörden finden Sie unter:{" "}
            <a
              href="https://www.bfdi.bund.de/DE/Service/Anschriften/Laender/Laender-node.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              www.bfdi.bund.de
            </a>.
          </p>

          {/* 7. Aktualität */}
          <h3 className="font-serif text-lg font-semibold text-foreground">7. Aktualität und Änderung dieser Datenschutzerklärung</h3>
          <p>
            Diese Datenschutzerklärung ist aktuell gültig (Stand: März 2026). Durch die Weiterentwicklung
            unserer Website oder aufgrund geänderter gesetzlicher bzw. behördlicher Vorgaben kann es
            notwendig werden, diese Datenschutzerklärung zu ändern.
          </p>
        </section>
      </div>
    </Layout>
  );
};

export default Impressum;
