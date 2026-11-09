//! Berserk mode's wandering: where the popped-out shrimp goes next as it
//! bounces around the screen. Plain maths, no Win32, so it can be tested anywhere.

use crate::shrimp::{FLAME_ANGER, MAX_ANGER};

/// Roaming speed, in 96-DPI pixels per second, when the shrimp first pops out.
pub const MIN_SPEED: f64 = 90.0;
/// Roaming speed, in 96-DPI pixels per second, once it's furious.
pub const MAX_SPEED: f64 = 300.0;

/// How fast an angry shrimp roams at `anger`, in 96-DPI pixels per second.
/// It doesn't move at all until the seaweed catches fire.
pub fn speed(anger: u8) -> f64 {
    if anger < FLAME_ANGER {
        return 0.0;
    }
    let steps = (MAX_ANGER - FLAME_ANGER).max(1) as f64;
    let frac = ((anger - FLAME_ANGER) as f64 / steps).min(1.0);
    MIN_SPEED + (MAX_SPEED - MIN_SPEED) * frac
}

/// The part of the screen the shrimp may wander, in screen pixels.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct Area {
    pub left: i32,
    pub top: i32,
    pub right: i32,
    pub bottom: i32,
}

pub struct Roam {
    x: f64,
    y: f64,
    /// Unit vector for the direction of travel.
    dx: f64,
    dy: f64,
    rng: u32,
}

impl Roam {
    /// Starts at top-left `(x, y)`, setting off up and to the left, out of the
    /// corner it pops out in. `seed` varies the angle so it doesn't always take
    /// the same path.
    pub fn new(x: i32, y: i32, seed: u32) -> Roam {
        let mut roam = Roam {
            x: x as f64,
            y: y as f64,
            dx: 0.0,
            dy: 0.0,
            rng: seed | 1,
        };
        // Somewhere between 25° and 65° above the horizontal, heading left.
        let angle = (25.0 + 40.0 * roam.random()).to_radians();
        roam.dx = -angle.cos();
        roam.dy = -angle.sin();
        roam
    }

    /// The shrimp's top-left corner, in screen pixels.
    pub fn position(&self) -> (i32, i32) {
        (self.x.round() as i32, self.y.round() as i32)
    }

    /// Moves `distance` pixels, bouncing off the edges of `area` so the whole
    /// `size`x`size` shrimp stays inside it. Each bounce nudges the angle a
    /// little so the path never settles into a loop.
    pub fn step(&mut self, distance: f64, area: Area, size: i32) -> (i32, i32) {
        let max_x = (area.right - size).max(area.left) as f64;
        let max_y = (area.bottom - size).max(area.top) as f64;
        let (min_x, min_y) = (area.left as f64, area.top as f64);

        self.x += self.dx * distance;
        self.y += self.dy * distance;

        let mut bounced = false;
        if self.x < min_x {
            self.x = min_x;
            self.dx = self.dx.abs();
            bounced = true;
        } else if self.x > max_x {
            self.x = max_x;
            self.dx = -self.dx.abs();
            bounced = true;
        }
        if self.y < min_y {
            self.y = min_y;
            self.dy = self.dy.abs();
            bounced = true;
        } else if self.y > max_y {
            self.y = max_y;
            self.dy = -self.dy.abs();
            bounced = true;
        }
        if bounced {
            self.wobble();
        }
        self.position()
    }

    /// Turns by up to ±15°, but never so far that it ends up skimming along an edge.
    fn wobble(&mut self) {
        let turn = (self.random() - 0.5) * 30f64.to_radians();
        let (sin, cos) = turn.sin_cos();
        let (dx, dy) = (self.dx * cos - self.dy * sin, self.dx * sin + self.dy * cos);
        // Keep both components at least sin(20°), keeping their signs.
        let min = 20f64.to_radians().sin();
        let dx = dx.signum() * dx.abs().max(min);
        let dy = dy.signum() * dy.abs().max(min);
        let len = (dx * dx + dy * dy).sqrt();
        self.dx = dx / len;
        self.dy = dy / len;
    }

    /// A number in [0, 1) from a tiny xorshift generator.
    fn random(&mut self) -> f64 {
        let mut x = self.rng;
        x ^= x << 13;
        x ^= x >> 17;
        x ^= x << 5;
        self.rng = x;
        x as f64 / (u32::MAX as f64 + 1.0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const AREA: Area = Area {
        left: 0,
        top: 0,
        right: 1920,
        bottom: 1040,
    };

    #[test]
    fn calm_shrimp_stays_put_and_angrier_is_faster() {
        assert_eq!(speed(0), 0.0);
        assert_eq!(speed(FLAME_ANGER - 1), 0.0);
        assert_eq!(speed(FLAME_ANGER), MIN_SPEED);
        assert_eq!(speed(MAX_ANGER), MAX_SPEED);
        for anger in FLAME_ANGER..MAX_ANGER {
            assert!(speed(anger + 1) > speed(anger));
        }
    }

    #[test]
    fn sets_off_up_and_left_out_of_the_corner() {
        for seed in 0..50 {
            let mut roam = Roam::new(1800, 900, seed);
            let (x, y) = roam.step(10.0, AREA, 100);
            assert!(x < 1800 && y < 900, "seed {seed}: went to ({x}, {y})");
        }
    }

    #[test]
    fn never_leaves_the_screen() {
        let size = 144;
        let mut roam = Roam::new(1700, 800, 7);
        for i in 0..20_000 {
            // Big steps and a growing shrimp, to make escaping as easy as possible.
            let size = size + (i % 50);
            let (x, y) = roam.step(37.0, AREA, size);
            assert!(x >= AREA.left && x + size <= AREA.right, "x = {x}");
            assert!(y >= AREA.top && y + size <= AREA.bottom, "y = {y}");
        }
    }

    #[test]
    fn keeps_moving_at_the_requested_speed() {
        let mut roam = Roam::new(900, 500, 3);
        let before = roam.position();
        let after = roam.step(50.0, AREA, 100);
        let moved = (((after.0 - before.0).pow(2) + (after.1 - before.1).pow(2)) as f64).sqrt();
        assert!((moved - 50.0).abs() < 1.5, "moved {moved}");
    }

    #[test]
    fn visits_all_four_edges() {
        let size = 100;
        let mut roam = Roam::new(1800, 900, 11);
        let (mut left, mut top, mut right, mut bottom) = (false, false, false, false);
        for _ in 0..20_000 {
            let (x, y) = roam.step(20.0, AREA, size);
            left |= x == AREA.left;
            top |= y == AREA.top;
            right |= x + size == AREA.right;
            bottom |= y + size == AREA.bottom;
        }
        assert!(left && top && right && bottom);
    }

    #[test]
    fn copes_with_a_screen_smaller_than_the_shrimp() {
        let tiny = Area {
            left: 10,
            top: 10,
            right: 50,
            bottom: 50,
        };
        let mut roam = Roam::new(10, 10, 5);
        for _ in 0..100 {
            assert_eq!(roam.step(25.0, tiny, 100), (10, 10));
        }
    }
}
