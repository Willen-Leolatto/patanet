import sys
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

# Cores oficiais da identidade visual PataNet
TEXT_DARK = HexColor("#0F172A")    # Slate 900
TEXT_BODY = HexColor("#334155")    # Slate 700
TEXT_MUTED = HexColor("#64748B")   # Slate 500
TEAL_PRIMARY = HexColor("#0D9488") # Teal 600
TEAL_LIGHT = HexColor("#F0FDFA")   # Teal 50
TEAL_BORDER = HexColor("#99F6E4")  # Teal 200
TEAL_DARK = HexColor("#00796B")    # Teal 700
BORDER_GRAY = HexColor("#E2E8F0")  # Slate 200
BG_CARD = HexColor("#F8FAFC")      # Slate 50

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []
        self.doc_header_title = "PATANET • DOCUMENTAÇÃO TÉCNICA E PLANO DIRETOR"

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        width, height = A4
        margin = 40
        # Cabeçalho a partir da página 2
        if self._pageNumber > 1:
            self.setFont("Helvetica", 8)
            self.setFillColor(TEXT_MUTED)
            self.drawString(margin, height - 35, self.doc_header_title)
            self.drawRightString(width - margin, height - 35, "CONFIDENCIAL & ESTRATÉGICO")
            self.setStrokeColor(BORDER_GRAY)
            self.setLineWidth(0.5)
            self.line(margin, height - 42, width - margin, height - 42)

        # Rodapé em todas as páginas
        self.setFont("Helvetica", 8)
        self.setFillColor(TEXT_MUTED)
        self.drawString(margin, 28, "PataNet — Ecossistema de Cuidado, Identificação e Resgate de Animais")
        self.drawRightString(width - margin, 28, f"Página {self._pageNumber} de {page_count}")
        self.setStrokeColor(BORDER_GRAY)
        self.setLineWidth(0.5)
        self.line(margin, 38, width - margin, 38)


def build_styles():
    base = getSampleStyleSheet()
    styles = {}
    
    styles['Badge'] = ParagraphStyle(
        'Badge',
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=TEAL_DARK,
        alignment=0
    )
    
    styles['DocTitle'] = ParagraphStyle(
        'DocTitle',
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=TEXT_DARK,
        spaceAfter=10
    )
    
    styles['DocSubtitle'] = ParagraphStyle(
        'DocSubtitle',
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=TEXT_MUTED,
        spaceAfter=12
    )
    
    styles['H1'] = ParagraphStyle(
        'H1',
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=TEXT_DARK,
        spaceBefore=8,
        spaceAfter=6
    )
    
    styles['H2'] = ParagraphStyle(
        'H2',
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=TEAL_DARK,
        spaceBefore=6,
        spaceAfter=3
    )

    styles['Body'] = ParagraphStyle(
        'Body',
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=TEXT_BODY,
        spaceAfter=4
    )
    
    styles['BodyBold'] = ParagraphStyle(
        'BodyBold',
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11.5,
        textColor=TEXT_DARK,
        spaceAfter=4
    )

    styles['TableHead'] = ParagraphStyle(
        'TableHead',
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=TEXT_DARK
    )
    
    styles['TableCell'] = ParagraphStyle(
        'TableCell',
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        textColor=TEXT_BODY
    )

    styles['SlideTitle'] = ParagraphStyle(
        'SlideTitle',
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=13,
        textColor=TEXT_DARK,
        spaceAfter=2
    )

    styles['SlideSubtitle'] = ParagraphStyle(
        'SlideSubtitle',
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=TEAL_PRIMARY,
        spaceAfter=5
    )

    styles['Code'] = ParagraphStyle(
        'Code',
        fontName='Courier',
        fontSize=6.5,
        leading=8.5,
        textColor=TEXT_DARK
    )

    return styles

def create_badge(text, styles):
    p = Paragraph(text, styles['Badge'])
    t = Table([[p]], colWidths=[515])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), HexColor("#E0F7FA")),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('BOX', (0,0), (-1,-1), 0.5, TEAL_BORDER),
    ]))
    return t

def create_metadata_table(left_items, right_items, styles):
    left_content = "<br/>".join([f"<b>{k}:</b> {v}" for k, v in left_items])
    right_content = "<br/>".join([f"<b>{k}:</b> {v}" for k, v in right_items])
    p_left = Paragraph(left_content, styles['Body'])
    p_right = Paragraph(right_content, styles['Body'])
    
    t = Table([[p_left, p_right]], colWidths=[257, 258])
    t.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
    ]))
    return t

def create_callout(title, text, styles):
    content = f"<b>{title}:</b> {text}"
    p = Paragraph(content, styles['Body'])
    t = Table([[p]], colWidths=[515])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), TEAL_LIGHT),
        ('BOX', (0,0), (-1,-1), 1, TEAL_PRIMARY),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    return t

def create_slide(title, subtitle, body, styles):
    p_title = Paragraph(title, styles['SlideTitle'])
    p_sub = Paragraph(subtitle, styles['SlideSubtitle'])
    p_body = Paragraph(body, styles['Body'])
    t = Table([[p_title], [p_sub], [p_body]], colWidths=[515])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_CARD),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_GRAY),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
        ('TOPPADDING', (0,0), (-1,-1), 7),
        ('BOTTOMPADDING', (0,0), (-1,-1), 7),
    ]))
    return t


def generate_plano_diretor(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=48,
        bottomMargin=48
    )
    styles = build_styles()
    story = []

    # ==================== PÁGINA 1 ====================
    story.append(create_badge("DOCUMENTO OFICIAL DE ENGENHARIA DE COMPUTAÇÃO & PRODUTO", styles))
    story.append(Spacer(1, 10))
    story.append(Paragraph("Plano Diretor de Arquitetura, Migração de Banco e Evolução de Sistemas", styles['DocTitle']))
    story.append(Paragraph(
        "Consolidação dos três subsistemas (Backend NestJS, Frontend React e PataNet Vision), migração de MySQL para PostgreSQL 16 + Prisma ORM via Docker Desktop, conformidade Google Play Store, LGPD e Marco Civil, módulo veterinário com validação rígida, petshops parceiras para adoção responsável e roadmap em 5 Waves.",
        styles['DocSubtitle']
    ))
    story.append(HRFlowable(width="100%", thickness=2, color=TEAL_PRIMARY, spaceBefore=4, spaceAfter=14))
    
    left_meta = [
        ("Projeto", "PataNet (PetEasy Ecosystem)"),
        ("Ambiente Local", "Windows 11 / Docker Desktop 4.88"),
        ("Status", "Aprovado para Execução em Waves"),
        ("Segurança Regulatória", "Google Play Store / LGPD / Marco Civil")
    ]
    right_meta = [
        ("Autor", "Engenharia de Computação & Antigravity AI"),
        ("Data de Emissão", "Setembro / 2026 (Revisão 2.0)"),
        ("Repositórios", "api, app, patanet-vision"),
        ("Governança", "Controle Estrito CRMV / CNPJ / Adoção")
    ]
    story.append(create_metadata_table(left_meta, right_meta, styles))
    story.append(Spacer(1, 14))

    # Resumo executivo na capa
    p_capa_title = Paragraph("<b>Síntese de Diretrizes e Alinhamento Estratégico</b>", styles['H2'])
    p_capa_body = Paragraph(
        "Este Plano Diretor consolida o plano mestre de modernização e escalabilidade do ecossistema PataNet. Estabelece a substituição técnica do MySQL pelo PostgreSQL 16 com Prisma ORM, garantindo type-safety de ponta a ponta e integração com busca vetorial de IA (pgvector). Além disso, padroniza as regras críticas de negócio: <b>(1) Módulo Veterinário</b> como role controlada e concedida com rigor exclusivamente por Administradores após validação de CRMV; <b>(2) Módulo Petshop</b> como entidade PJ parceira credenciada para catálogo de serviços e <b>Adoção Responsável</b> com transferência formal de custódia; <b>(3) Conformidade irrestrita com a Google Play Store</b> (exclusão de conta in-app e web, moderação ágil de UGC e veto absoluto à comercialização ilegal de animais); e <b>(4) Canal de Denúncias</b> com triagem imediata e arquitetura preparada para despacho formal a entidades públicas de proteção animal.",
        styles['Body']
    )
    t_capa = Table([[p_capa_title], [p_capa_body]], colWidths=[515])
    t_capa.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_CARD),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_GRAY),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_capa)

    # ==================== PÁGINA 2 ====================
    story.append(PageBreak())
    story.append(Paragraph("1. Diagnóstico do Estado Atual dos Subsistemas", styles['H1']))
    story.append(Paragraph("O ecossistema PataNet encontra-se dividido em três frentes principais que foram unificadas localmente no mesmo espaço de trabalho:", styles['Body']))
    story.append(Spacer(1, 4))

    table_data = [
        [
            Paragraph("Subsistema", styles['TableHead']),
            Paragraph("Stack Tecnológica", styles['TableHead']),
            Paragraph("Situação e Principais Desafios", styles['TableHead'])
        ],
        [
            Paragraph("<b>Backend API<br/>(NestJS)</b>", styles['TableCell']),
            Paragraph("NestJS 11, TypeScript, Clean DDD Hexagonal, TypeORM, MySQL 8.4, AWS S3", styles['TableCell']),
            Paragraph("Módulos core implementados (Auth, Pets, Posts, Bloqueios). Pendências críticas: stubs em presença de eventos, ausência de Swagger/OpenAPI, 16 testes E2E falhando por concorrência e acoplamento a 28 migrations manuais.", styles['TableCell'])
        ],
        [
            Paragraph("<b>Frontend App<br/>(React)</b>", styles['TableCell']),
            Paragraph("React 19, Vite 7, Tailwind CSS v4, Zustand, React Router v7, Capacitor 7 (Android)", styles['TableCell']),
            Paragraph("Interface moderna com fluxos de feed, perfil, carteira de vacinas/medicamentos e build mobile. Consome rotas que no backend eram stubs; necessita de fluxos completos de Adoção Responsável, Termos LGPD e Exclusão de Conta Play Store.", styles['TableCell'])
        ],
        [
            Paragraph("<b>Visão Comp.<br/>(PataNet Vision)</b>", styles['TableCell']),
            Paragraph("Python 3.11, FastAPI, YOLOv8n, CLIP ViT-B/32, FAISS-CPU, Streamlit", styles['TableCell']),
            Paragraph("Pipeline de busca visual funcional em laboratório, mas isolado da API NestJS, sem validação Pydantic estrita, sem conteinerização CPU-only e sem integração com VLM Multimodal para laudos explicativos e triagem de maus-tratos.", styles['TableCell'])
        ]
    ]
    diag_table = Table(table_data, colWidths=[95, 140, 280])
    diag_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), BG_CARD),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_GRAY),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(diag_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("2. Avaliação de Migração: MySQL 8.4 ➔ PostgreSQL 16 + Prisma ORM", styles['H1']))
    story.append(Paragraph("A migração do banco relacional e da camada de persistência foi validada sob critérios estritos de engenharia de computação:", styles['Body']))
    
    bullets = [
        "<b>• UUIDs Nativos:</b> O MySQL simula UUIDs como VARCHAR(36). O PostgreSQL possui tipo nativo de 16 bytes, acelerando índices B-Tree, joins e chaves estrangeiras.",
        "<b>• Extensão pgvector:</b> Permite salvar os embeddings visuais de 512D gerados pelo CLIP/Vision diretamente em colunas vector do PostgreSQL, viabilizando consultas por similaridade no próprio banco relacional.",
        "<b>• Eliminação de Dívida do TypeORM:</b> O TypeORM atual acumula 28 scripts de migrations manuais e duplicidade de anotações em classes. O Prisma consolida todas as entidades em um único schema.prisma declarativo e gera tipos estritos de TypeScript.",
        "<b>• Baixo Impacto Arquitetural:</b> Graças ao padrão DDD Hexagonal, o core de negócio (domain e application) é 100% agnóstico a banco. A mudança atinge apenas os repositórios da pasta infrastructure/persistence/prisma.",
        "<b>• Ambiente Docker Desktop:</b> Configuração de dois containers independentes: postgres (porta 5432, banco dev) e postgres-test (porta 5433, banco de testes isolado)."
    ]
    for b in bullets:
        story.append(Paragraph(b, styles['Body']))
    
    story.append(Spacer(1, 4))
    story.append(create_callout(
        "Garantia de Isolamento",
        "O container postgres-test rodará com runInBand: true no Jest, eliminando as falhas de concorrência e race conditions catalogadas no documento de falhas do E2E.",
        styles
    ))

    # ==================== PÁGINA 3 ====================
    story.append(PageBreak())
    story.append(Paragraph("3. Módulos Estruturais, Segurança e Conformidade Regulatória", styles['H1']))
    
    sec3_items = [
        ("3.1 Módulo Veterinário (/vet) & Prontuário Oficial",
         "O perfil veterinário constitui uma <b>role especial na conta do usuário (VETERINARIAN)</b>. O acesso é submetido a <b>controle e validação estritos pelo Administrador</b> mediante conferência documental (CRMV ativo, UF e comprovante de regularidade). O veterinário pode atuar de forma autônoma ou vinculado a petshops/clínicas. A atuação clínica requer <b>autorização prévia do tutor</b> do pet. Permite agendar exames, procedimentos, prescrever medicamentos e emitir o prontuário digital oficial (MedicalRecord), com anamnese, histórico de vacinas oficiais (lote/fabricante) e laudos periciais no S3."),
        
        ("3.2 Módulo Petshop (/petshops) & Adoção Responsável",
         "A conta de Petshop é uma <b>entidade parceira Pessoa Jurídica (PJ)</b>, distinta de uma conta de usuário comum, exigindo controle cadastral rígido pelo Admin (CNPJ, alvará e responsável técnico). Podem criar anúncios de serviços, eventos e associar veterinários credenciados. <b>Regra de Ouro da Adoção Responsável:</b> Animais cadastrados por petshops/ONGs são destinados <b>exclusivamente à adoção responsável</b> (sendo terminantemente proibida a venda indiscriminada de animais). O sistema implementa o fluxo formal de <b>transferência de custódia</b> da PJ da petshop para a conta do tutor adotante na plataforma, com emissão do Termo Digital de Adoção."),
        
        ("3.3 Presença em Eventos (/events/:id/attend)",
         "Substituição dos stubs de presença pela entidade EventAttendance com constraint UNIQUE(eventId, userId), controle atômico de capacidade de público, gestão de lista de espera (WAITLIST) e promoção automática em caso de desistência."),
        
        ("3.4 Aceite de Termos LGPD e Marco Civil (/auth/accept-terms)",
         "Campos termsAcceptedAt e termsVersion no usuário. Criação do TermsAcceptedGuard global no NestJS bloqueando acessos protegidos com HTTP 403 caso o usuário não tenha aceitado a versão vigente. Retenção de registros de acesso a aplicações por 6 meses, conforme Art. 15 do Marco Civil da Internet."),
        
        ("3.5 Conformidade com Políticas da Google Play Store",
         "Implementação dos requisitos obrigatórios da Google Play Store: <b>(1) Exclusão de Conta e Dados</b> integralmente disponível no app e via página web pública (/delete-account); <b>(2) Moderação Ativa de UGC</b> com botões visíveis de denúncia e bloqueio instantâneo de usuários, com SLA de análise em até 24h; <b>(3) Veto ao Comércio Ilícito de Animais</b> em harmonia com diretrizes de bem-estar animal; e <b>(4) Princípio do Mínimo Privilégio</b> nas permissões de câmera, galeria e GPS."),
        
        ("3.6 Canal de Denúncias e Roteamento para Órgãos Públicos",
         "Triagem imediata de denúncias (maus-tratos, comércio irregular, CSAM, abusos) enviada à moderação via e-mail configurado. Arquitetura desacoplada preparada para integração direta via Webhook/API com <b>meios de comunicação de entidades públicas</b> (Delegacias de Proteção Animal, Ministério Público, Centros de Zoonoses e Disque-Denúncia), preservando provas digitais e localização para investigações oficiais."),
        
        ("3.7 Correções Críticas no Core",
         "<b>POST /users:</b> Retorno obrigatório do body com ID e dados do usuário (corrige quebra do E2E). <b>FollowUseCase:</b> Validação prévia de existência do usuário alvo. <b>Feed Filter:</b> Exclusão de posts de usuários mutuamente bloqueados via cláusula NOT IN (SELECT blocked_id...). <b>Uploads S3:</b> Validação estrita de magic bytes contra arquivos maliciosos e conversão automática para WebP.")
    ]
    for title, desc in sec3_items:
        story.append(Paragraph(title, styles['H2']))
        story.append(Paragraph(desc, styles['Body']))
        story.append(Spacer(1, 2))

    # ==================== PÁGINA 4 ====================
    story.append(PageBreak())
    story.append(Paragraph("4. Plano de Execução Estruturado em 5 Waves", styles['H1']))
    story.append(Paragraph("Para garantir entrega contínua com risco zero de regressão, a engenharia estabeleceu 5 Waves sequenciais:", styles['Body']))
    story.append(Spacer(1, 4))

    wave_data = [
        [Paragraph("Wave", styles['TableHead']), Paragraph("Foco Principal", styles['TableHead']), Paragraph("Entregáveis Técnicos", styles['TableHead']), Paragraph("Agentes", styles['TableHead'])],
        [
            Paragraph("<b>Wave 1</b>", styles['TableCell']),
            Paragraph("Banco, Docker & Prisma", styles['TableCell']),
            Paragraph("Docker PostgreSQL 16 (dev/test), schema.prisma consolidado com 22 entidades (User com roles, VeterinarianProfile, Petshop PJ, AdoptionTransfer, MedicalRecord, EventAttendance), PrismaService e repositórios de persistência.", styles['TableCell']),
            Paragraph("A-DBA<br/>A-BACKEND", styles['TableCell'])
        ],
        [
            Paragraph("<b>Wave 2</b>", styles['TableCell']),
            Paragraph("Swagger & E2E Resiliente", styles['TableCell']),
            Paragraph("Swagger/OpenAPI completo em /api/docs, exportação de swagger.json, correção de retorno no POST /users, dinamização de emails nos testes e 100% de aprovação no Jest E2E com isolamento --runInBand.", styles['TableCell']),
            Paragraph("A-BACKEND<br/>A-QA", styles['TableCell'])
        ],
        [
            Paragraph("<b>Wave 3</b>", styles['TableCell']),
            Paragraph("Negócio, Compliance & Órgãos Públicos", styles['TableCell']),
            Paragraph("Presença real em eventos (EventAttendance), TermsAcceptedGuard (LGPD), query de bloqueio no feed, Módulo /vet (validação Admin e prontuário), Módulo /petshops (PJ e Adoção Responsável), canal de denúncias públicas e rota de exclusão de contas Play Store.", styles['TableCell']),
            Paragraph("A-BACKEND<br/>A-DBA", styles['TableCell'])
        ],
        [
            Paragraph("<b>Wave 4</b>", styles['TableCell']),
            Paragraph("Vision & IA Forense Multimodal", styles['TableCell']),
            Paragraph("Refatoração FastAPI (Clean Python + Pydantic v2), remoção de variáveis mutáveis, endpoint /sync/pet, Docker CPU-only, laudo forense empático via Gemini 2.0 Flash e módulo de triagem de maus-tratos/ferimentos.", styles['TableCell']),
            Paragraph("A-VISION<br/>A-BACKEND", styles['TableCell'])
        ],
        [
            Paragraph("<b>Wave 5</b>", styles['TableCell']),
            Paragraph("Frontend Mobile & CI/CD", styles['TableCell']),
            Paragraph("Telas do app React/Capacitor (Adoção Responsável, Carteira Clínica, Termos LGPD, Busca Visual de Pets Perdidos, Exclusão de Conta), docker-compose monorepo unificado e pipeline GitHub Actions CI/CD.", styles['TableCell']),
            Paragraph("A-FRONTEND<br/>A-QA", styles['TableCell'])
        ]
    ]
    wave_table = Table(wave_data, colWidths=[45, 95, 290, 85])
    wave_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), BG_CARD),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_GRAY),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(wave_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("5. Apresentação de Pitch Executivo: Modernização da Engenharia PataNet", styles['H1']))
    story.append(Paragraph("Alinhamento estratégico e diretrizes técnicas para investidores e liderança:", styles['Body']))
    story.append(Spacer(1, 4))

    story.append(create_slide(
        "SLIDE 1: O PONTO DE INFLEXÃO DA ENGENHARIA",
        "Aceleração sem Dívida Técnica",
        "O PataNet possui uma base de código rica, mas operava com acoplamento a um banco MySQL de 28 migrations manuais, testes E2E com falhas de concorrência e falta de padronização nos contratos de API. Este plano transforma o backend em uma fortaleza resiliente pronta para escala nacional.",
        styles
    ))
    story.append(Spacer(1, 6))
    story.append(create_slide(
        "SLIDE 2: A PROPOSTA DE VALOR DA NOVA ARQUITETURA",
        "PostgreSQL 16 + Prisma ORM + Docker Desktop",
        "Ao migrar para PostgreSQL e Prisma, ganhamos: (1) Tipagem estrita de ponta a ponta que impede bugs de compilação; (2) Índices com UUID nativo 4x mais leves que VARCHAR; (3) Suporte a pgvector para unificar IA e dados relacionais; e (4) Prisma Studio para governança visual imediata dos dados.",
        styles
    ))

    # ==================== PÁGINA 5 ====================
    story.append(PageBreak())
    story.append(create_slide(
        "SLIDE 3: O FIM DO DESALINHAMENTO COM O FRONTEND",
        "Swagger OpenAPI como Fonte Única da Verdade",
        "Anteriormente, o frontend consumia stubs ou dependia de coleções manuais do Postman. Com a documentação viva em /api/docs e os contratos formais em OpenAPI, o time de Frontend sabe exatamente o payload, headers e códigos de erro de cada endpoint em tempo real.",
        styles
    ))
    story.append(Spacer(1, 6))
    story.append(create_slide(
        "SLIDE 4: SEGURANÇA JURÍDICA E COMPLIANCE GOOGLE PLAY / LGPD",
        "Arquitetura Blindada para Publicação e Proteção Legal",
        "A incorporação de fluxo de exclusão de contas in-app e web, moderação ativa de UGC, canal de denúncias integrado a órgãos públicos, validação estrita de CRMV/CNPJ e termo formal de adoção responsável asseguram conformidade total com as diretrizes do Google Play e com a LGPD.",
        styles
    ))
    story.append(Spacer(1, 6))
    story.append(create_slide(
        "SLIDE 5: MODELO DE PARCERIAS ÉTICAS E ADOÇÃO RESPONSÁVEL",
        "Ecossistema de Confiança: Veterinários, Petshops e Tutores",
        "Ao separar a conta institucional de Petshops da conta de usuários comuns e estabelecer que animais cadastrados por parceiros destinam-se exclusivamente à adoção responsável, o PataNet posiciona-se na vanguarda do bem-estar animal. O histórico médico contínuo aproxima tutores de veterinários de confiança.",
        styles
    ))
    story.append(Spacer(1, 6))
    story.append(create_slide(
        "SLIDE 6: VISÃO DE FUTURO E ESCALABILIDADE NACIONAL",
        "Prontidão para Milhões de Pets e Parcerias com o Setor Público",
        "Com infraestrutura conteinerizada, suíte de testes que valida fluxos de ponta a ponta e integração inteligente com o serviço de visão computacional, o PataNet deixa de ser um MVP de laboratório e torna-se uma plataforma robusta pronta para produção, expansão nacional e captação de investimento.",
        styles
    ))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Gerado com sucesso: {filename}")


def generate_vision_pitch(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=48,
        bottomMargin=48
    )
    styles = build_styles()
    story = []

    # ==================== PÁGINA 1 ====================
    story.append(create_badge("ESPECIFICAÇÃO TÉCNICA E DE PRODUTO: IA & VISÃO COMPUTACIONAL", styles))
    story.append(Spacer(1, 10))
    story.append(Paragraph("PataNet Vision: Identificação Visual, Biometria Animal e Reencontro de Pets Perdidos", styles['DocTitle']))
    story.append(Paragraph(
        "Especificação técnica e de produto do microsserviço de IA: pipeline híbrido com YOLOv8, CLIP e VLM Multimodal (Gemini), tratamento de degradação física (sujeira, ferimentos e magreza), triagem de maus-tratos, relato público sem login e suporte à adoção responsável.",
        styles['DocSubtitle']
    ))
    story.append(HRFlowable(width="100%", thickness=2, color=TEAL_PRIMARY, spaceBefore=4, spaceAfter=14))
    
    left_meta = [
        ("Sistema", "PataNet Vision Microservice"),
        ("Status", "Especificação Oficial de Arquitetura"),
        ("Modelos", "YOLOv8, CLIP ViT-B/32, Gemini 2.0"),
        ("Impacto Social", "Resgate Ágil & Proteção Animal")
    ]
    right_meta = [
        ("Especialidade", "Biometria Animal & Visão Computacional"),
        ("Classificação", "Documentação de Engenharia e UX"),
        ("Integração", "Backend NestJS + Frontend App"),
        ("Conformidade", "Diretrizes de Segurança & LGPD")
    ]
    story.append(create_metadata_table(left_meta, right_meta, styles))
    story.append(Spacer(1, 14))

    p_capa_title = Paragraph("<b>Síntese da Inovação Tecnológica e Humanitária</b>", styles['H2'])
    p_capa_body = Paragraph(
        "O PataNet Vision resolve o gargalo central do desaparecimento de animais no ambiente urbano: animais perdidos sofrem desnutrição acelerada e acúmulo de sujeira/lama que inutilizam métodos ingênuos de reconhecimento visual. Combinando <b>Head Invariance</b> (foco na estrutura craniofacial inalterada), <b>análise cromática HSV</b> (isolamento de lama e sangue) e <b>inteligência multimodal explicável</b> (Gemini API com prompt forense veterinário), o sistema gera laudos empáticos e precisos. Além disso, introduz o conceito de <b>Relato Sem Fricção (No-Login)</b> na rua para envio em menos de 10 segundos e integra triagem automática de ferimentos para apoio a entidades públicas de resgate.",
        styles['Body']
    )
    t_capa = Table([[p_capa_title], [p_capa_body]], colWidths=[515])
    t_capa.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_CARD),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_GRAY),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_capa)

    # ==================== PÁGINA 2 ====================
    story.append(PageBreak())
    story.append(Paragraph("1. Visão de Produto e Experiência do Usuário (UX)", styles['H1']))
    story.append(Paragraph("O PataNet Vision opera como o cérebro inteligente da rede social pet, orquestrando quatro jornadas simultâneas:", styles['Body']))
    story.append(Spacer(1, 4))

    journeys = [
        ("1.1 Jornada do Tutor: Declaração de Pet Perdido (STATUS: LOST)",
         "Ao perceber o sumiço, o tutor clica em 'Declarar Pet Perdido' no app. O animal entra no status LOST e suas fotos de referência (rosto, peito, perfil) entram com prioridade máxima no índice biométrico de busca vetorial do PataNet Vision."),
        
        ("1.2 Jornada do Cidadão na Rua: Relato Sem Necessidade de Login",
         "Regra Crítica de Negócio: Para garantir agilidade máxima e eliminar qualquer fricção no momento do avistamento na rua, não é necessário possuir conta ou estar autenticado para enviar um relato. Qualquer pessoa pode abrir o link 'Avistei um Pet', gravar um vídeo curto de até 15s ou fotos e submeter em menos de 10 segundos com localização GPS automática."),
        
        ("1.3 Jornada do Reencontro: Alerta Inteligente e Laudo Forense",
         "Quando o algoritmo detecta compatibilidade biométrica superior a 85%, o tutor recebe um alerta push no celular contendo: (1) Fotos lado a lado do cadastro versus a foto na rua; (2) Laudo em linguagem natural explicando as marcas coincidentes; (3) Avaliação de estado físico (se o pet está sujo ou magro); e (4) Mapa com a rota exata do avistamento."),
        
        ("1.4 Decisão Human-in-the-Loop para o Status 'FOUND'",
         "O sistema não altera o pet para FOUND de forma unilateral para evitar falsos alarmes. A alteração de estado é feita pelo próprio tutor ao clicar em 'Confirmar Resgate', momento em que o sistema publica um post comemorativo no feed e encerra o alerta."),
        
        ("1.5 Biometria na Adoção Responsável por Petshops",
         "Animais cadastrados por petshops e ONGs para adoção responsável passam pelo escaneamento biométrico do PataNet Vision. Esse cadastro garante identificação única, impede cadastros duplicados e preserva o histórico do pet antes e depois da adoção pelo tutor.")
    ]
    for title, desc in journeys:
        story.append(Paragraph(title, styles['H2']))
        story.append(Paragraph(desc, styles['Body']))
        story.append(Spacer(1, 2))

    story.append(Spacer(1, 4))
    story.append(Paragraph("2. Arquitetura Interna de Engenharia e Pipeline de IA", styles['H1']))
    story.append(Paragraph("O PataNet Vision é estruturado em um pipeline integrado de alta eficiência:", styles['Body']))
    story.append(Spacer(1, 4))

    pipe_data = [
        [Paragraph("Estágio", styles['TableHead']), Paragraph("Tecnologia", styles['TableHead']), Paragraph("Função Técnica no Pipeline", styles['TableHead'])],
        [
            Paragraph("<b>1. Extração &<br/>Normalização</b>", styles['TableCell']),
            Paragraph("FFmpeg + OpenCV + CLAHE", styles['TableCell']),
            Paragraph("Em vídeos de até 15s, extrai os 5 frames mais nítidos por variância Laplaciana. Aplica equalização adaptativa de histograma para mitigar sombras severas e sujeira superficial.", styles['TableCell'])
        ],
        [
            Paragraph("<b>2. Detecção &<br/>Segmentação</b>", styles['TableCell']),
            Paragraph("YOLOv8n + YOLOv8n-seg", styles['TableCell']),
            Paragraph("Detecta e recorta o animal na imagem. A segmentação isola o fundo urbano e separa regiões corporais específicas (cabeça, peito, dorso, patas e cauda).", styles['TableCell'])
        ],
        [
            Paragraph("<b>3. Invariância &<br/>Busca Vetorial</b>", styles['TableCell']),
            Paragraph("CLIP ViT-B/32 + FAISS / pgvector", styles['TableCell']),
            Paragraph("Gera embeddings de 512D das características estruturais (Head Features). Executa busca k-NN com re-ranking k-reciprocal, filtrando pets com status LOST na região geográfica.", styles['TableCell'])
        ]
    ]
    pipe_table = Table(pipe_data, colWidths=[90, 130, 295])
    pipe_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), BG_CARD),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_GRAY),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(pipe_table)

    # ==================== PÁGINA 3 ====================
    story.append(PageBreak())
    
    pipe_data_cont = [
        [Paragraph("Estágio", styles['TableHead']), Paragraph("Tecnologia", styles['TableHead']), Paragraph("Função Técnica no Pipeline", styles['TableHead'])],
        [
            Paragraph("<b>4. Raciocínio<br/>Multimodal VLM</b>", styles['TableCell']),
            Paragraph("Gemini 2.0 Flash Multimodal", styles['TableCell']),
            Paragraph("Recebe a foto original e a foto da rua. Aplica um System Prompt Forense que desconsidera sujeira e emagrecimento temporário, avaliando manchas faciais, orelhas e olhos, emitindo um JSON estruturado com laudo empático.", styles['TableCell'])
        ]
    ]
    pipe_table_cont = Table(pipe_data_cont, colWidths=[90, 130, 295])
    pipe_table_cont.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), BG_CARD),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_GRAY),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(pipe_table_cont)
    story.append(Spacer(1, 10))

    story.append(Paragraph("2.5 Triagem de Sinais de Maus-Tratos e Roteamento de Emergência", styles['H1']))
    story.append(Paragraph(
        "Durante o processamento de imagens e vídeos submetidos por pedestres na rua, o modelo de visão executa um módulo detector de condições físicas críticas:",
        styles['Body']
    ))
    
    abuse_items = [
        "<b>• Detecção de Lesões e Ferimentos Graves:</b> Filtros de segmentação e análise morfológica identificam lacerações abertas, hemorragias ou membros com fraturas evidentes.",
        "<b>• Avaliação de Desnutrição Severa (Grau Crítico de BCS):</b> Estimativa visual da espinha dorsal e costelas protuberantes, classificando o animal em estado de emergência vital.",
        "<b>• Identificação de Adereços de Contenção Abusivos:</b> Reconhecimento de arames, correntes curtas ou coleiras incrustadas na pele.",
        "<b>• Roteamento Probatório para Entidades Públicas:</b> Quando um animal é identificado com sinais extremos de crueldade ou risco de vida, o PataNet Vision dispara um flag de emergência no módulo de denúncias do backend, empacotando coordenadas GPS, horário e evidências visuais para imediato acionamento de órgãos públicos (Delegacia de Proteção Animal, Centros de Zoonoses e resgates municipais)."
    ]
    for item in abuse_items:
        story.append(Paragraph(item, styles['Body']))
        story.append(Spacer(1, 2))

    story.append(Spacer(1, 6))
    story.append(create_callout(
        "Integração Humanitária",
        "O PataNet Vision não atua apenas como um localizador de pets de famílias, mas como uma rede sensorial de vigilância e proteção ativa do bem-estar animal em cidades inteligentes.",
        styles
    ))

    # ==================== PÁGINA 4 ====================
    story.append(PageBreak())
    story.append(Paragraph("3. Tratamento de Animais Sujos, Feridos e Desnutridos", styles['H1']))
    story.append(Paragraph("Animais que passam dias nas ruas sofrem degradações físicas severas que enganam algoritmos ingênuos de similaridade de cor. O PataNet Vision adota técnicas compensatórias especializadas:", styles['Body']))
    
    comp_items = [
        "<b>• Isolamento da Estrutura Craniofacial (Head Invariance):</b> A cabeça e a relação geométrica entre os olhos, focinho e stop nasal de cães e gatos sofrem alteração mínima com o emagrecimento, ao contrário do abdômen e tórax. O extrator de Head Features atribui maior peso à biometria facial.",
        "<b>• Módulo de Avaliação de Condição Corporal (BCS):</b> A segmentação anatômica mede a relação entre largura e altura corporal para estimar perda de massa muscular, sinalizando ao modelo que a silhueta esguia é decorrente de desnutrição e não de porte menor do pet.",
        "<b>• Detecção Cromática de Lama e Lesões:</b> Filtros de matiz e saturação no espaço HSV identificam manchas exógenas (óleo, terra, sangue) e as isolam para não confundir com o padrão genético da pelagem.",
        "<b>• Prompt Forense Veterinário no VLM:</b> O modelo de linguagem multimodal recebe instruções explícitas para raciocinar como um perito veterinário: 'Desconsidere a pelagem escura de lama e a magreza; avalie o desenho da mancha na orelha esquerda, a despigmentação nasal e a cor da íris'."
    ]
    for item in comp_items:
        story.append(Paragraph(item, styles['Body']))
        story.append(Spacer(1, 2))

    story.append(Spacer(1, 8))
    story.append(Paragraph("4. Especificação de Contratos de API Internos", styles['H1']))
    story.append(Paragraph("O PataNet Vision expõe dois endpoints REST principais consumidos pelo Backend NestJS:", styles['Body']))
    
    code_text = (
        "POST /internal/sightings/analyze<br/>"
        "Content-Type: multipart/form-data<br/>"
        "Payload: sighting_id, latitude, longitude, media_file (foto ou vídeo)<br/><br/>"
        "Resposta Estruturada JSON:<br/>"
        "{<br/>"
        "&nbsp;&nbsp;\"ok\": true,<br/>"
        "&nbsp;&nbsp;\"detected_species\": \"dog\",<br/>"
        "&nbsp;&nbsp;\"physical_state_observed\": {<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;\"is_dirty\": true, \"dirtiness_severity\": \"MODERATE\",<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;\"has_visible_injuries\": false, \"body_condition\": \"UNDERWEIGHT\",<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;\"abuse_suspected\": false<br/>"
        "&nbsp;&nbsp;},<br/>"
        "&nbsp;&nbsp;\"matches\": [{<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;\"pet_id\": \"b3c5a7f2-1234-4b5c-890a-fedcba098765\",<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;\"pet_name\": \"Rex\",<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;\"confidence_score\": 0.92,<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;\"invariant_matches\": [\"Mancha branca na bochecha direita\", \"Orelha semi-ereta\"],<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;\"tutor_friendly_summary\": \"Encontramos um cãozinho com 92% de chance de ser o Rex...\"<br/>"
        "&nbsp;&nbsp;}]<br/>"
        "}"
    )
    p_code = Paragraph(code_text, styles['Code'])
    t_code = Table([[p_code]], colWidths=[515])
    t_code.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_CARD),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_GRAY),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_code)

    # ==================== PÁGINA 5 ====================
    story.append(PageBreak())
    story.append(Paragraph("5. Apresentação de Pitch de Produto: A Revolução do Resgate Inteligente", styles['H1']))
    story.append(Paragraph("Pitch executivo apresentando a proposta de valor e a disrupção do PataNet Vision:", styles['Body']))
    story.append(Spacer(1, 4))

    story.append(create_slide(
        "SLIDE 1: A DOR OCULTA DO DESAPARECIMENTO PET",
        "Milhares de Famílias Sem Resposta",
        "Todos os dias, milhares de animais de estimação somem nas cidades brasileiras. O método tradicional de busca depende de cartazes em postes, posts dispersos no WhatsApp e torcida pela sorte. Quando um pet é avistado, muitas vezes está sujo ou magro e ninguém o reconhece.",
        styles
    ))
    story.append(Spacer(1, 5))
    story.append(create_slide(
        "SLIDE 2: A DISRUPÇÃO TECNOLÓGICA DO PATANET VISION",
        "Biometria Real Contra a Degradação Urbana",
        "O PataNet Vision não é um simples classificador de raças: é um perito biométrico artificial. Ele é o único sistema projetado para enxergar através da lama, dos ferimentos e da fome, identificando traços anatômicos perenes que ligam o animal da rua ao animal amado de casa.",
        styles
    ))
    story.append(Spacer(1, 5))
    story.append(create_slide(
        "SLIDE 3: O PODER DO RELATO SEM BARREIRAS (NO-LOGIN)",
        "A Comunidade como Rede Sensorial de Resgate",
        "Ao eliminar a necessidade de login para relatar avistamentos, transformamos qualquer pessoa na calçada em um potencial resgatador. Em menos de 10 segundos, um pedestre envia um vídeo e a IA faz o trabalho pesado de cruzamento geográfico e visual.",
        styles
    ))
    story.append(Spacer(1, 5))
    story.append(create_slide(
        "SLIDE 4: INTELIGÊNCIA MULTIMODAL EXPLICÁVEL",
        "Confiança com Laudos que Acalmam Tutores",
        "Em vez de apenas entregar um percentual frio, nossa IA Multimodal conversa com o tutor em tom empático e forense: explica que o animal está sujo, mas que as marcas faciais e olhos coincidem, dando a certeza necessária para o deslocamento e resgate imediato.",
        styles
    ))
    story.append(Spacer(1, 5))
    story.append(create_slide(
        "SLIDE 5: IMPACTO SOCIAL, PROTEÇÃO PÚBLICA E RETENÇÃO",
        "O Propósito Máximo de um Ecossistema Pet",
        "O reencontro de um pet perdido é a experiência emocional mais poderosa que uma plataforma pet pode proporcionar. Cada animal resgatado e cada situação de vulnerabilidade reportada a entidades públicas consolidam a marca na mente dos tutores e atraem novos usuários orgânicos todos os dias.",
        styles
    ))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Gerado com sucesso: {filename}")

if __name__ == "__main__":
    docs_dir = os.path.dirname(os.path.abspath(__file__))
    plano_pdf = os.path.join(docs_dir, "PataNet_Plano_Diretor_Arquitetura.pdf")
    vision_pdf = os.path.join(docs_dir, "PataNet_Vision_Especificacao_IA_Pitch.pdf")
    
    generate_plano_diretor(plano_pdf)
    generate_vision_pitch(vision_pdf)
