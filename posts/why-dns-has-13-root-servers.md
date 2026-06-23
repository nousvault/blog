---
title: Why DNS only has 13 root servers
date: 2026-06-23
type: til
slug: why-dns-has-13-root-servers
---

The global DNS system is constrained to 13 logical root servers — and the reason comes down to a packet size limit set in the 1980s.

Early DNS was designed to fit entirely inside a single UDP packet. UDP packets at the time were capped at 512 bytes. Each root server entry takes roughly 32 bytes (the name plus an IPv4 address). Do the math: 512 ÷ 32 ≈ 16, minus overhead, and you land at 13 as the practical ceiling.

So the number 13 was never a deliberate design choice. It was the accidental output of a hardware constraint from a different era.

## What actually runs the internet today

The 13 "root servers" you've heard about are logical entries — named `a.root-servers.net` through `m.root-servers.net`. In practice, each one is backed by a cluster of hundreds of physical machines distributed globally via **anycast routing**.

Anycast means multiple machines share the same IP address. When your device queries `a.root-servers.net`, it doesn't travel to one specific machine — it routes to whichever physical server is geographically closest, based on BGP routing tables. As of 2024, there are over 1,700 root server instances worldwide.

The 512-byte limit was eventually lifted by [RFC 2671 (EDNS)](https://datatracker.ietf.org/doc/html/rfc2671) in 1999, which extended DNS to support larger packets. But the 13-server architecture stuck. Changing it would require updating every DNS resolver on the planet simultaneously — a coordination problem nobody wants to solve.

## The takeaway

The internet's foundational infrastructure was shaped more by 1980s RAM limitations than by forward-looking architecture. The 13 root servers are a fossil of that constraint, kept alive by path dependency and the sheer impossibility of coordinated global change.

Source: https://www.iana.org/domains/root/servers
