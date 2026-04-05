import dbConnect from "@/lib/mongodb"
import Settings, { type ISettings } from "@/models/Settings"

import { clampNumber, fromScaledInteger, toScaledInteger } from "@/lib/utils/numeric"

const DEFAULT_DAILY_PROFIT_PERCENT = 1.5
const DEFAULT_TEAM_DAILY_PROFIT_PERCENT: number | null = null

function parseBound(value: string | undefined, fallback: number): number {
  if (!value) return fallback
  const numeric = Number.parseFloat(value)
  if (!Number.isFinite(numeric)) return fallback
  return numeric
}

const DAILY_PROFIT_PERCENT_MIN = parseBound(process.env.DAILY_PROFIT_PERCENT_MIN, 0)
const DAILY_PROFIT_PERCENT_MAX = parseBound(process.env.DAILY_PROFIT_PERCENT_MAX, 100)

const TEAM_DAILY_PROFIT_PERCENT_MIN = parseBound(process.env.TEAM_DAILY_PROFIT_PERCENT_MIN, 0)
const TEAM_DAILY_PROFIT_PERCENT_MAX = parseBound(process.env.TEAM_DAILY_PROFIT_PERCENT_MAX, 100)

export class DailyProfitPercentValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DailyProfitPercentValidationError"
  }
}

export class TeamDailyProfitPercentValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "TeamDailyProfitPercentValidationError"
  }
}

function extractPercentValue(source: unknown): number | null {
  const scaled = toScaledInteger(source, 2)
  if (scaled === null) return null
  return fromScaledInteger(scaled, 2)
}

export function getDailyProfitPercentBounds(): { min: number; max: number } {
  return {
    min: DAILY_PROFIT_PERCENT_MIN,
    max: DAILY_PROFIT_PERCENT_MAX,
  }
}

export function getTeamDailyProfitPercentBounds(): { min: number; max: number } {
  return {
    min: TEAM_DAILY_PROFIT_PERCENT_MIN,
    max: TEAM_DAILY_PROFIT_PERCENT_MAX,
  }
}

/* ---------------------------
   GET DAILY PROFIT PERCENT
--------------------------- */

export async function getDailyProfitPercent(): Promise<number> {
  await dbConnect()

  const settings = await Settings.findOne()

  if (!settings || !settings.dailyProfitPercent) {
    return DEFAULT_DAILY_PROFIT_PERCENT
  }

  const percent = extractPercentValue(settings.dailyProfitPercent)

  if (percent === null) {
    return DEFAULT_DAILY_PROFIT_PERCENT
  }

  const bounds = getDailyProfitPercentBounds()

  return clampNumber(percent, bounds.min, bounds.max)
}

/* ---------------------------
   UPDATE DAILY PROFIT
--------------------------- */

export async function updateDailyProfitPercent(nextPercent: unknown): Promise<number> {

  const bounds = getDailyProfitPercentBounds()

  const scaled = toScaledInteger(nextPercent, 2)

  if (scaled === null) {
    throw new DailyProfitPercentValidationError(
      "Enter a valid percentage with up to two decimals."
    )
  }

  const percent = fromScaledInteger(scaled, 2)

  if (percent < bounds.min || percent > bounds.max) {
    throw new DailyProfitPercentValidationError(
      `Daily profit percent must be between ${bounds.min}% and ${bounds.max}%`
    )
  }

  await dbConnect()

  await Settings.findOneAndUpdate(
    {},
    {
      $set: {
        dailyProfitPercent: percent,
      },
    },
    { new: true, upsert: true }
  )

  return percent
}

/* ---------------------------
   TEAM DAILY PROFIT
--------------------------- */

export async function getTeamDailyProfitPercent(): Promise<number | null> {

  await dbConnect()

  const settings = await Settings.findOne()

  if (!settings || settings.teamDailyProfitPercent == null) {
    return DEFAULT_TEAM_DAILY_PROFIT_PERCENT
  }

  const percent = extractPercentValue(settings.teamDailyProfitPercent)

  if (percent === null) return null

  const bounds = getTeamDailyProfitPercentBounds()

  return clampNumber(percent, bounds.min, bounds.max)
}

export async function updateTeamDailyProfitPercent(nextPercent: unknown): Promise<number | null> {

  const bounds = getTeamDailyProfitPercentBounds()

  if (nextPercent === null || nextPercent === "") {

    await dbConnect()

    await Settings.findOneAndUpdate(
      {},
      { $unset: { teamDailyProfitPercent: "" } },
      { upsert: true }
    )

    return null
  }

  const scaled = toScaledInteger(nextPercent, 2)

  if (scaled === null) {
    throw new TeamDailyProfitPercentValidationError(
      "Enter a valid percentage with up to two decimals."
    )
  }

  const percent = fromScaledInteger(scaled, 2)

  if (percent < bounds.min || percent > bounds.max) {
    throw new TeamDailyProfitPercentValidationError(
      `Team daily profit percent must be between ${bounds.min}% and ${bounds.max}%`
    )
  }

  await dbConnect()

  await Settings.findOneAndUpdate(
    {},
    {
      $set: {
        teamDailyProfitPercent: percent,
      },
    },
    { new: true, upsert: true }
  )

  return percent
}