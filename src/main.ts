import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Request, Response } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as bodyParser from 'body-parser';
import { CandidatesService } from './candidates/candidates.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const express = app.getHttpAdapter().getInstance();
  
  // Obtener el servicio de candidatos
  const candidatesService = app.get(CandidatesService);

  // Habilitar CORS para pruebas
  app.enableCors();

  // Configurar body parser para texto plano (para XML)
  express.use(bodyParser.text({ type: 'text/xml' }));
  express.use(bodyParser.text({ type: 'application/xml' }));

  // Cargar WSDLs
  const demoWsdlXml = readFileSync(join(__dirname, '../wsdl/demo.wsdl'), 'utf8');
  const candidatesWsdlXml = readFileSync(join(__dirname, '../wsdl/candidates.wsdl'), 'utf8');
  const getAllCandidatesWsdlXml = readFileSync(join(__dirname, '../wsdl/get-all-candidates.wsdl'), 'utf8');

  // Implementación manual del servicio SOAP
  express.get('/soap/demo', (req: Request, res: Response) => {
    console.log('GET /soap/demo - Query params:', req.query);
    if (req.query.wsdl !== undefined) {
      res.set('Content-Type', 'text/xml; charset=utf-8');
      res.send(demoWsdlXml);
    } else {
      res.status(404).json({ message: 'WSDL no encontrado. Use ?wsdl' });
    }
  });

  express.post('/soap/demo', (req: Request, res: Response) => {
    console.log('SOAP POST recibido:', req.body);
    
    // Extraer el mensaje del XML como texto
    let message = 'pong';
    
    try {
      if (typeof req.body === 'string') {
        // Buscar el mensaje en el XML usando regex
        const match = req.body.match(/<message>(.*?)<\/message>/);
        if (match) {
          message = match[1];
        }
      }
    } catch (error) {
      console.log('Error parseando XML, usando mensaje por defecto:', error);
    }
    
    const result = `pong: ${message}`;
    
    // Respuesta SOAP
    const soapResponse = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <PingResponse xmlns="http://example.com/demo">
      <result>${result}</result>
    </PingResponse>
  </soap:Body>
</soap:Envelope>`;

    res.set('Content-Type', 'text/xml; charset=utf-8');
    res.send(soapResponse);
  });

  // Endpoint para WSDL de candidatos
  express.get('/soap/candidates', (req: Request, res: Response) => {
    console.log('GET /soap/candidates - Query params:', req.query);
    if (req.query.wsdl !== undefined) {
      res.set('Content-Type', 'text/xml; charset=utf-8');
      res.send(candidatesWsdlXml);
    } else {
      res.status(404).json({ message: 'WSDL no encontrado. Use ?wsdl' });
    }
  });

  // Endpoint para WSDL de obtener todos los candidatos
  express.get('/soap/get-all-candidates', (req: Request, res: Response) => {
    console.log('GET /soap/get-all-candidates - Query params:', req.query);
    if (req.query.wsdl !== undefined) {
      res.set('Content-Type', 'text/xml; charset=utf-8');
      res.send(getAllCandidatesWsdlXml);
    } else {
      res.status(404).json({ message: 'WSDL no encontrado. Use ?wsdl' });
    }
  });

  // Endpoint POST para operaciones SOAP de candidatos
  express.post('/soap/candidates', async (req: Request, res: Response) => {
    console.log('SOAP POST candidatos recibido:', req.body);
    
    try {
      if (typeof req.body === 'string') {
        // Detectar la operación basada en el contenido del XML
        let soapResponse = '';
        
        if (req.body.includes('CreateCandidate')) {
          // Extraer datos del CreateCandidateRequest
          const idMatch = req.body.match(/<id>(.*?)<\/id>/);
          const nameMatch = req.body.match(/<name>(.*?)<\/name>/);
          const emailMatch = req.body.match(/<email>(.*?)<\/email>/);
          
          const id = idMatch ? idMatch[1] : 'generated-id';
          const name = nameMatch ? nameMatch[1] : 'Candidato sin nombre';
          const email = emailMatch ? emailMatch[1] : 'sin@email.com';
          
          // Crear candidato real en la base de datos
          const candidate = await candidatesService.createCandidate({ id, name, email });
          
          soapResponse = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <CreateCandidateResponse xmlns="http://example.com/candidates">
      <candidate>
        <id>${candidate.id}</id>
        <name>${candidate.name}</name>
        <email>${candidate.email}</email>
      </candidate>
    </CreateCandidateResponse>
  </soap:Body>
</soap:Envelope>`;
        } else if (req.body.includes('AddSkillToCandidate')) {
          // Extraer datos del AddSkillToCandidateRequest
          const candidateIdMatch = req.body.match(/<candidateId>(.*?)<\/candidateId>/);
          const skillNameMatch = req.body.match(/<skillName>(.*?)<\/skillName>/);
          
          const candidateId = candidateIdMatch ? candidateIdMatch[1] : 'unknown';
          const skillName = skillNameMatch ? skillNameMatch[1] : 'unknown skill';
          
          // Agregar habilidad real a la base de datos
          await candidatesService.addSkill({ candidateId, skillName });
          
          soapResponse = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <AddSkillToCandidateResponse xmlns="http://example.com/candidates">
      <status>Habilidad "${skillName}" agregada exitosamente al candidato ${candidateId}</status>
    </AddSkillToCandidateResponse>
  </soap:Body>
</soap:Envelope>`;
        } else if (req.body.includes('FindCandidatesBySkill')) {
          // Extraer datos del FindCandidatesBySkillRequest
          const skillNameMatch = req.body.match(/<skillName>(.*?)<\/skillName>/);
          const skillName = skillNameMatch ? skillNameMatch[1] : 'unknown skill';
          
          // Buscar candidatos reales en la base de datos
          const candidates = await candidatesService.findBySkill(skillName);
          
          let candidatesXml = '';
          candidates.forEach(candidate => {
            candidatesXml += `
        <candidate>
          <id>${candidate.id}</id>
          <name>${candidate.name}</name>
          <email>${candidate.email}</email>
        </candidate>`;
          });
          
          soapResponse = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <FindCandidatesBySkillResponse xmlns="http://example.com/candidates">
      <candidates>${candidatesXml}
      </candidates>
    </FindCandidatesBySkillResponse>
  </soap:Body>
</soap:Envelope>`;
        } else {
          // Respuesta de error para operaciones no reconocidas
          soapResponse = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <soap:Fault>
      <faultcode>soap:Client</faultcode>
      <faultstring>Operación no reconocida</faultstring>
    </soap:Fault>
  </soap:Body>
</soap:Envelope>`;
        }
        
        res.set('Content-Type', 'text/xml; charset=utf-8');
        res.send(soapResponse);
      } else {
        res.status(400).json({ message: 'Cuerpo de la petición no válido' });
      }
    } catch (error) {
      console.log('Error procesando SOAP de candidatos:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  });

  // Endpoint POST para obtener todos los candidatos
  express.post('/soap/get-all-candidates', async (req: Request, res: Response) => {
    console.log('SOAP POST get-all-candidates recibido:', req.body);
    
    try {
      if (typeof req.body === 'string') {
        // Obtener candidatos reales de la base de datos
        const candidates = await candidatesService.getAllCandidates();
        
        // Generar XML de respuesta
        let candidatesXml = '';
        candidates.forEach(candidate => {
          let skillsXml = '';
          if (candidate.skills && candidate.skills.length > 0) {
            candidate.skills.forEach(skill => {
              skillsXml += `
        <skill>
          <name>${skill.name}</name>
          <level>${skill.level}</level>
        </skill>`;
            });
          }

          candidatesXml += `
      <candidate>
        <id>${candidate.id}</id>
        <name>${candidate.name}</name>
        <email>${candidate.email}</email>
        <skills>${skillsXml}
        </skills>
      </candidate>`;
        });

        const soapResponse = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetAllCandidatesResponse xmlns="http://example.com/getallcandidates">
      <candidates>${candidatesXml}
      </candidates>
      <totalCount>${candidates.length}</totalCount>
      <status>Éxito</status>
    </GetAllCandidatesResponse>
  </soap:Body>
</soap:Envelope>`;

        res.set('Content-Type', 'text/xml; charset=utf-8');
        res.send(soapResponse);
      } else {
        res.status(400).json({ message: 'Cuerpo de la petición no válido' });
      }
    } catch (error) {
      console.log('Error procesando GetAllCandidates:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  
  console.log(`🚀 Servidor ejecutándose en http://localhost:${port}`);
  console.log(`📡 Endpoint SOAP Demo: http://localhost:${port}/soap/demo`);
  console.log(`📄 WSDL Demo: http://localhost:${port}/soap/demo?wsdl`);
  console.log(`📡 Endpoint SOAP Candidatos: http://localhost:${port}/soap/candidates`);
  console.log(`📄 WSDL Candidatos: http://localhost:${port}/soap/candidates?wsdl`);
  console.log(`📡 Endpoint SOAP Obtener Todos: http://localhost:${port}/soap/get-all-candidates`);
  console.log(`📄 WSDL Obtener Todos: http://localhost:${port}/soap/get-all-candidates?wsdl`);
}
bootstrap();
