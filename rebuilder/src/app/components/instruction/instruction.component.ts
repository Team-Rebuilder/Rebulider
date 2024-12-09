import { Component, ElementRef, OnInit, inject, input, viewChild } from '@angular/core';
import { ModelnavbarComponent } from '../modelnavbar/modelnavbar.component';
import { timer } from 'rxjs';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist';
import { ModelsService } from '../../services/models.service';
import { MatSliderModule } from '@angular/material/slider';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@4.9.155/build/pdf.worker.min.mjs`;
;

@Component({
  selector: 'app-instruction',
  standalone: true,
  imports: [ModelnavbarComponent, MatSliderModule, FormsModule],
  templateUrl: './instruction.component.html',
  styleUrl: './instruction.component.css'
})

// This component was adapted from a ChatGPT generation:
// https://chatgpt.com/share/67529b54-7d84-8001-ab91-74f2566228d3

// Double-buffered render approach/code generated by GitHub Copilot
export class InstructionComponent {
  modelsService = inject(ModelsService);

  src = input.required<string>();
  private modelCanvas = viewChild<ElementRef>("canvas");
  private offscreenCanvas = document.createElement('canvas');
  private pdf: PDFDocumentProxy | null = null;
  private pdfUrl: string = "";
  currentPage: number = 1;
  formerPage: number = -1;
  pageCount: number = 0;

  private id: string | undefined;
  private currModel$: any;

  async ngOnInit(): Promise<void> {
    // Event listener for arrow key navigation
    window.addEventListener('keydown', this.handleKeyDown.bind(this));

    this.route.paramMap.subscribe(params => {
      this.id = params.get('id')!;
    });

    // Get the model by id
    // Since getModelById returns a promise, we need to await it
    this.currModel$ = await this.modelsService.getModelById(this.id!);

    this.modelsService.models$.subscribe(models => {
      this.pdfUrl = this.currModel$.instructionUrls[0];
      this.loadPdf().then(() => {
        requestAnimationFrame(() => this.renderPdf());
      });
    });
  }

  constructor(private route: ActivatedRoute) {}

  ngOnDestroy() {
    // Event listener for arrow key navigation
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
  }

  async loadPdf() {
    const pdf = await pdfjsLib.getDocument(this.pdfUrl).promise;
    this.pdf = pdf;
    this.pageCount = pdf.numPages;
  }

  // Render a page of the PDF using an offscreen canvas
  async renderPage(pageNumber: number, offscreenCanvas: HTMLCanvasElement) {
    if (this.pdf) {
      const page = await this.pdf.getPage(pageNumber);
  
      const context = this.offscreenCanvas.getContext('2d')!;
      const viewport = page.getViewport({ scale: 1.5 });
  
      offscreenCanvas.width = viewport.width;
      offscreenCanvas.height = viewport.height;
  
      await page.render({ canvasContext: context, viewport: viewport }).promise;
    }
  }
  
  // Copy any newly rendered page to the visible canvas
  renderPdf() {
    if (this.currentPage !== this.formerPage) {
      this.formerPage = this.currentPage;
  
      this.renderPage(this.currentPage, this.offscreenCanvas).then(() => {
        const canvas = this.modelCanvas()?.nativeElement;
        const context = canvas.getContext('2d')!;
        canvas.width = this.offscreenCanvas.width;
        canvas.height = this.offscreenCanvas.height;
        context.drawImage(this.offscreenCanvas, 0, 0);
      });
    }
    setTimeout(() => requestAnimationFrame(() => this.renderPdf()), 300);
  }

  // Code generated by GitHub Copilot using the prompt:
  // "How do I add event listeners for arrow keys to call nextPage() and previousPage()?""
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowRight') {
      this.nextPage();
    } else if (event.key === 'ArrowLeft') {
      this.previousPage();
    }
  }

  // Prevent non-standard arrow key navigation using slider
  doNothing(event: KeyboardEvent) {
    event.preventDefault();
  }

  nextPage() {
    if (this.currentPage < this.pageCount) {
      this.currentPage++;
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }
}
