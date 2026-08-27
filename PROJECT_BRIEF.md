# Imagen Construct — Project Brief

## One-sentence definition

**Imagen Construct is an open-source, local-first generative image editor where each generated scene element is stored as an independent layer that can be moved, transformed, removed, and regenerated without rebuilding the complete image.**

## Problem

AI image generation is fast at producing alternatives but weak at controlled composition. A user who dislikes one sofa, one character, or one color often has to regenerate a large region or the entire image, risking unwanted changes elsewhere.

## Product hypothesis

A layer-first workflow will be more controllable than a flat prompt-and-regenerate workflow for scenes that require repeated, precise revisions.

## Primary promise

> Build the image element by element. Change only what is wrong.

## Initial audience

- independent creators and illustrators;
- game and visual-novel teams;
- content creators;
- graphic designers and small agencies;
- developers experimenting with local image models.

## What the first product is

- a desktop-first 2D scene compositor;
- a non-destructive layer editor;
- a local model orchestrator;
- an open integration surface for generation, transparency, segmentation, and future depth tools.

## What it is not

- a replacement for Photoshop, Krita, Blender, or ComfyUI;
- a 3D scene editor;
- a promise of perfect lighting and perspective after arbitrary object movement;
- a cloud generation service;
- a mobile-first product;
- a custom foundation model.

## Validation question

**Does generating an image element by element as independent layers provide enough control and speed to be preferable to repeatedly regenerating a flattened image?**

## First proof

A user creates a four-layer scene—background, sofa, character, table—then changes the sofa without modifying the other three layers.
