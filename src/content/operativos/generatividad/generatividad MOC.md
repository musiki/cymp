
- es un sistema que a partir de reglas podemos modelar que podemos hacer de él. 
- Utilizamos reglas para hacer decisiones (rule-based decision making) que generan un material de salida: números , gráficos, sonidos.
- Los modelos generativos son marcos computacionales diseñados para aprender y replicar las distribuciones de probabilidad subyacentes de los datos, lo que permite la generación de nuevos puntos de datos sintéticos que se asemejan al conjunto de datos original. 
- Estos modelos se basan en el aprendizaje estadístico y la optimización, y a menudo aprovechan las redes neuronales para aproximar distribuciones complejas. 
- Se aplican ampliamente en campos como la síntesis de imágenes, la generación de texto y la composición musical, donde permiten obtener resultados creativos y especulativos.
-  Entre sus principios fundamentales se incluyen la representación del espacio latente, la optimización mediante retropropagación y el entrenamiento adversarial. 
- Históricamente, los modelos generativos han evolucionado desde marcos probabilísticos simples, como las máquinas de Boltzmann, hasta arquitecturas sofisticadas, como las redes generativas adversarias (GAN) (@Goodfellow2014) y los autoencodificadores variacionales (VAE) (@Kingma2013). 
- Su desarrollo se ha caracterizado tanto por avances como por controversias, especialmente en torno a cuestiones de éticas y sesgo de datos.


Hopfield Networks
- associative memory 
- weights
- data points
- pattern completion
Boltzmann Machines

## ejemplos

Sol LeWitt
Brian Eno
Marius Watz
Casey Reas

```dataview
list
from #generative OR #generatividad OR #generativad 
```


---


#### Prehistoria
~3000 a. C. [[Patrones algorítmicos]] [[Desconocido (escribas mesopotámicos)]] [[Diseño repetitivo]] [[Secuencias matemáticas]] [[Tabletas de arcilla, por ejemplo, Plimpton 322]] [[Arte geométrico mesopotámico]]
- **Detalles**: Las primeras tablillas de arcilla mesopotámicas (por ejemplo, Plimpton 322, ~1800 a. C.) muestran patrones numéricos sistemáticos, similares a los protoalgoritmos. Estos influyeron en el arte decorativo y la arquitectura, sentando las bases para la generación basada en reglas.
~1200 a. C. [[Tejido en telar]] [[Desconocido (antiguos tejedores)]] [[Patrones mecanizados]] [[Algoritmos textiles]] [[Textiles arqueológicos]] [[Tejidos estampados]]
- **Detalles**: El telar, uno de los primeros dispositivos «programables», utilizaba tarjetas perforadas o secuencias manuales para generar complejos diseños textiles. Esto prefigura la automatización generativa en el arte y la cultura.
~350 a. C. [[Geometría euclidiana]] [[Euclides]] [[Reglas geométricas]] [[Construcción sintética]] [[Elementos, Euclides, ~300 a. C.]] [[Diseños arquitectónicos griegos]]
- **Detalles**: Los «Elementos» de Euclides codificaron las reglas para generar formas y estructuras, lo que influyó en el arte (por ejemplo, los templos griegos) y, más tarde, en la geometría computacional del diseño generativo.
#### Early Modern Era
1641 [[Mechanical Calculators]] [[Blaise Pascal]] [[Automated Computation]] [[Arithmetic Sequences]] [[Pascal, 1642]] [[Pascaline Device]]
- **Details**: Pascal’s calculator, the Pascaline, mechanized arithmetic operations, a step toward automating generative processes. No direct artwork, but it inspired later computational tools.
1837 [[Analytical Engine]] [[Charles Babbage]] [[Programmable Computation]] [[Algorithmic Design]] [[Babbage, 1843]] [[Ada Lovelace’s Notes]]
- **Details**: Conceived with Ada Lovelace, the Analytical Engine was the first design for a general-purpose computer, with Lovelace envisioning it generating music or art via algorithms. Never built, but conceptually pivotal.
1843 [[Lovelace’s Algorithm]] [[Ada Lovelace]] [[Generative Programming]] [[Symbolic Sequences]] [[Lovelace, 1843]] [[Notes on the Analytical Engine]]
- **Details**: Lovelace’s notes on Babbage’s machine included the first algorithm intended for a computer, suggesting generative applications (e.g., music composition), making her the "first programmer."
1936 [[Turing Machine]] [[Alan Turing]] [[Universal Computation]] [[Algorithmic Processes]] [[Turing, 1936]] [[Early Computer Art Experiments]]
- **Details**: Turing’s theoretical machine (On Computable Numbers, 1936) defined computation, enabling all later generative systems. Early computer art in the 1950s owes its existence to this concept.
1943 [[McCulloch-Pitts Neuron]] [[Warren McCulloch]] [[Neural Modeling]] [[Logical Computation]] [[McCulloch & Pitts, 1943]] [[Neural Art Inspirations]]
- **Details**: This model of artificial neurons influenced Perceptron and neural networks, bridging biology and computation. Precursor to generative neural art.
1948 [[Cybernetics]] [[Norbert Wiener]] [[Feedback Systems]] [[Self-Regulation]] [[Wiener, 1948]] [[Cybernetic Art Installations]]
- **Details**: Wiener’s "Cybernetics" introduced feedback loops, inspiring generative systems and interactive art (e.g., Gordon Pask’s 1960s installations).
1950 [[Shannon’s Information Theory]] [[Claude Shannon]] [[Probabilistic Models]] [[Data Compression]] [[Shannon, 1948]] [[Generative Music Experiments]]
- **Details**: Shannon’s work on information entropy influenced probabilistic generative models (e.g., HMMs) and early computer music.
---
1943 [[Artificial Neural Networks]] McCulloch Pitts, 
1956 [[Lisp]] [[John McCarthy]] [[Symbolic Programming]] [[Lambda Calculus]] [[McCarthy, 1960]] [[AARON by Harold Cohen]]
1958 [[Perceptron]] [[Frank Rosenblatt]] [[Neural Networks]] [[Supervised Learning]] [[Rosenblatt, 1958]]  
- Laid the foundation for neural computation; no direct artwork, but inspired later generative systems.
1962 [[Self-Organizing Maps (SOM)]] [[Teuvo Kohonen]] [[Topology Preservation]] [[Unsupervised Learning]] [[Kohonen, 1982]]  
- Early unsupervised learning model; used in data visualization and pattern recognition, indirectly influencing generative art.
1969 [[Hidden Markov Models (HMM)]] [[Leonard Baum]] [[Probabilistic Models]] [[Sequential Data]] [[Baum & Petrie, 1966]]  
- Critical for speech synthesis and music generation; applied in early algorithmic compositions.
1982 [[Hopfield Networks]] [[John Hopfield]] [[Recurrent Neural Networks]] [[Associative Memory]] [[Hopfield, 1982]]  
- Influenced memory-based generative systems; no specific artwork, but foundational for neural art concepts.
1983 [[Boltzmann Machines]] [[Geoffrey Hinton]] [[Stochastic Networks]] [[Energy-Based Models]] [[Ackley, Hinton, Sejnowski, 1985]]  
- Pioneered energy-based generative modeling; precursor to deep generative art tools.
1986 [[Backpropagation]] [[David Rumelhart]] [[Gradient Descent]] [[Multi-Layer Perceptron]] [[Rumelhart, Hinton & Williams, 1986]]  
- Enabled training of complex neural networks; essential for all later generative models.
1993 [[Long Short-Term Memory (LSTM)]] [[Sepp Hochreiter]] [[Recurrent Networks]] [[Memory Cells]] [[Hochreiter & Schmidhuber, 1997]]  
- Revolutionized sequence modeling; used in music generation (e.g., Magenta’s AI compositions).
2003 [[Restricted Boltzmann Machines (RBM)]] [[Geoffrey Hinton]] [[Deep Learning]] [[Energy-Based Models]] [[Hinton, 2006]]  
- Key building block for deep generative models; influenced early neural art experiments.
2006 [[Deep Belief Networks (DBN)]] [[Geoffrey Hinton]] [[Layerwise Pretraining]] [[Probabilistic Graphical Models]] [[Hinton et al., 2006]]  
- Advanced unsupervised learning; used in early artistic feature extraction.
2013 [[Word2Vec]] [[Tomas Mikolov]] [[Word Embeddings]] [[Distributed Representations]] [[Mikolov et al., 2013]]  
- Transformed natural language processing; foundational for text-based generative art (e.g., poetry generation).
2014 [[Generative Adversarial Networks (GANs)]] [[Ian Goodfellow]] [[Adversarial Learning]] [[Neural Generative Models]] [[Goodfellow et al., 2014]] [[This Person Does Not Exist]]  
- Revolutionized art with photorealistic image generation; widely applied in digital art (e.g., Artbreeder).
2014 [[Variational Autoencoders (VAE)]] [[Diederik Kingma]] [[Latent Representations]] [[Probabilistic Inference]] [[Kingma & Welling, 2014]]  
- Enabled controlled generative outputs; used in abstract art generation.
2016 [[WaveNet]] [[Aaron van den Oord]] [[Autoregressive Models]] [[Audio Synthesis]] [[Oord et al., 2016]]  
- Breakthrough in audio generation; applied in AI music (e.g., Google’s WaveNet voices).
2017 [[Transformer Networks]] [[Ashish Vaswani]] [[Self-Attention]] [[Sequence-to-Sequence Learning]] [[Vaswani et al., 2017]]  
- Core of modern NLP and multimodal models; powers text-to-art systems.
2018 [[GPT (Generative Pre-trained Transformer)]] [[Alec Radford]] [[Pretrained Language Models]] [[Transformer Architecture]] [[Radford et al., 2018]]  
- Pioneered scalable text generation; influenced AI storytelling and poetry.
2018 [[StyleGAN]] [[Tero Karras]] [[Style-Based Generation]] [[High-Resolution Images]] [[Karras et al., 2019]] [[AI-Generated Portraits]]  
- Advanced artistic control in image synthesis; used in NFT art and virtual avatars.
2020 [[Diffusion Models]] [[Jonathan Ho]] [[Denoising Processes]] [[Deep Generative Models]] [[Ho et al., 2020]]  
- High-quality image synthesis; foundation for later art tools like DALL-E 2.
2021 [[DALL-E]] [[Aditya Ramesh]] [[Text-to-Image Generation]] [[Multimodal Learning]] [[Ramesh et al., 2021]] [[AI-Generated Surreal Art]]  
- Bridged text and visuals; widely used in creative industries for surrealist artworks.
2021 [[CLIP]] [[Alec Radford]] [[Contrastive Learning]] [[Image-Text Alignment]] [[Radford et al., 2021]]  
- Enhanced multimodal generation; paired with VQ-VAE for art (e.g., VQ-VAE+CLIP artworks).
2022 [[Stable Diffusion]] [[Robin Rombach]] [[Latent Diffusion]] [[Image Synthesis]] [[Rombach et al., 2022]] [[Community-Generated Art]]  
- Democratized art generation; popularized via Midjourney and open-source platforms.
2023 [[Sora]] [[OpenAI]] [[Video Generation]] [[Diffusion-Based Video]] [[OpenAI, 2023]] [[AI-Generated Short Films]]  
- Extended generative art to video; early applications in experimental filmmaking.
---

## Clasificación de modelos generativos según su impacto en la sociedad, la cultura y la ciencia
1. 2017 Redes transformadoras Ashish Vaswani  
2. 2014 Redes generativas adversarias Ian Goodfellow  
3. 2022 Difusión estable Robin Rombach  
4. 2021 DALL-E Aditya Ramesh  
5. 2018 GPT Alec Radford  
6. 2014 Autoencoders variacionales Diederik Kingma  
7. 2020 Modelos de difusión Jonathan Ho  
8. 1993 Memoria a corto y largo plazo Sepp Hochreiter  
9. 2018 StyleGAN Tero Karras  
10. 2006 Redes de creencias profundas Geoffrey Hinton  
11. 2021 CLIP Alec Radford  
12. 2013 Word2Vec Tomas Mikolov  
13. 2016 WaveNet Aaron van den Oord  
14. 1986 Retropropagación David Rumelhart  
15. 1983 Máquinas de Boltzmann Geoffrey Hinton  
16. 2023 Sora OpenAI  
17. 2003 Máquinas de Boltzmann restringidas Geoffrey Hinton  
18. 1982 Redes de Hopfield John Hopfield  
19. 1969 Modelos ocultos de Markov Leonard Baum  
20. 1962 Mapas autoorganizados Teuvo Kohonen  
21. 1958 Perceptrón Frank Rosenblatt

---
This list prioritizes models with broad societal reach (e.g., Transformer, GANs, Stable Diffusion), cultural significance (e.g., DALL-E, StyleGAN), and scientific foundations (e.g., Backpropagation, LSTM), while keeping the format simple and link-free. Let me know if you’d like further adjustments!
hive

### Notes on Refinement
1. **Corrections**: Adjusted dates (e.g., Boltzmann Machines to 1983, Diffusion Models to 2020) and authorship (e.g., Kingma & Welling for VAE) for accuracy.
2. **Filtering**: Removed less generative-focused models (e.g., SVM, Q-Learning) and duplicates (e.g., multiple GPT entries), keeping only seminal versions.
3. **Additions**: Included culturally impactful models like StyleGAN, WaveNet, CLIP, Stable Diffusion, and Sora, which have direct applications in art and science.
4. **Artwork**: Added examples like "This Person Does Not Exist" (GANs), AI surreal art (DALL-E), and community art (Stable Diffusion) where applicable.
5. **Focus**: Emphasized models with clear generative output (images, text, audio, video) over purely theoretical ones unless foundational (e.g., Perceptron).
This list balances historical significance, technical innovation, and cultural impact, tailored to your focus on art, culture, and science. Let me know if you’d like further adjustments or a ranked version!

## Core
1. **Latent Space Representation**: Generative models often operate by mapping input data into a lower-dimensional <mark class='>hltr-blue'>latent space</mark>, where meaningful patterns can be extracted. This is central to VAEs, which optimize a probabilistic encoder-decoder framework (@Kingma2013). Mathematically, this involves minimizing the Kullback-Leibler divergence: $$ D_{KL}(q(z|x) \parallel p(z)) $$.
2. **Adversarial Training**: Introduced by <mark class='>hltr-yellow'>Goodfellow et al. (2014)</mark>, GANs employ a game-theoretic approach where a generator competes with a discriminator. This has led to breakthroughs in image synthesis but also raised concerns about <mark class='>hltr-red'>mode collapse</mark> and ethical misuse.
3. **Associative Memory**: Inspired by <mark class='>hltr-yellow'>Hopfield Networks</mark>, generative models can perform pattern completion by storing data points as attractors in a high-dimensional space (@Hopfield1982). This connects to Boltzmann Machines, which use stochastic units to model energy-based distributions (@Hinton1985).
4. **Speculative Applications**: Generative models have been used in creative fields like music composition (<mark class='>hltr-purple'>Briot et al., 2020</mark>) and digital fabrication (<mark class='>hltr-purple'>Oxman et al., 2016</mark>), pushing the boundaries of human-machine collaboration.
5. **Ethical Challenges**: The rise of deepfakes and synthetic media has sparked debates on <mark class='>hltr-red'>data authenticity</mark> and accountability (@Chesney2018). These issues are particularly relevant in speculative philosophy and digital ethics.
6. **Interdisciplinary Connections**: Generative models intersect with fields like quantum computing (<mark class='>hltr-blue'>quantum generative adversarial networks</mark>) (@Lloyd2018) and bioinformatics (<mark class='>hltr-blue'>protein structure prediction</mark>) (@Jumper2021).
---
## ## Preguntas de investigación
1. **¿Cuáles son los retos teóricos emergentes en los modelos generativos?**  
   - Los retos actuales incluyen mejorar la interpretabilidad de los modelos, abordar la amplificación del sesgo y escalar a espacios de datos de alta dimensión (@Arjovsky2017).  
   - ¿Cómo podemos conciliar la complejidad de los modelos y la eficiencia computacional?
2. **¿Cómo se relaciona el modelado generativo con los debates contemporáneos en la filosofía especulativa?**  
   - Los modelos generativos desafían las nociones tradicionales de autoría y creatividad (@Boden2009).  
   - ¿Pueden estos modelos contribuir a nuevas formas de pensamiento especulativo o incluso a la estética poshumana?
3. **¿A qué aplicaciones especulativas o disruptivas podrían conducir los modelos generativos en un futuro próximo?**  
   - Entre las posibles aplicaciones se incluyen las herramientas de diseño impulsadas por la IA para la arquitectura (@Oxman2016) o la medicina personalizada mediante la generación de datos biológicos sintéticos (@Topol2019).  
   - ¿Podrían los modelos generativos permitir formas completamente nuevas de expresión artística o producción cultural?
---
## References

```bibtex
@article{Goodfellow2014,
  title={Generative Adversarial Nets},
  author={Goodfellow, Ian J. and Pouget-Abadie, Jean and Mirza, Mehdi and Xu, Bing and Warde-Farley, David and Ozair, Sherjil and Courville, Aaron C.},
  journal={Advances in Neural Information Processing Systems},
  volume={27},
  year={2014}
}
@article{Kingma2013,
  title={Auto-Encoding Variational Bayes},
  author={Kingma, Diederik P. and Welling, Max},
  journal={arXiv preprint arXiv:1312.6114},
  year={2013}
}
@article{Hopfield1982,
  title={Neural Networks and Physical Systems with Emergent Collective Computational Abilities},
  author={Hopfield, John J.},
  journal={Proceedings of the National Academy of Sciences},
  volume={79},
  number={8},
  pages={2554--2558},
  year={1982}
}
@article{Hinton1985,
  title={A Learning Algorithm for Boltzmann Machines},
  author={Hinton, Geoffrey E. and Sejnowski, Terrence J.},
  journal={Cognitive Science},
  volume={9},
  number={1},
  pages={147--169},
  year={1985}
}

```
