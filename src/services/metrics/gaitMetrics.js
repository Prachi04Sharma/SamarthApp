// New file for sophisticated gait analysis metrics
import * as tf from '@tensorflow/tfjs';

export class GaitMetricsAnalyzer {
  constructor() {
    this.baselineData = null;
    this.historicalData = [];
    this.normalRanges = {
      walkingSpeed: { min: 1.0, max: 1.4 }, // meters/second
      strideLength: { min: 0.5, max: 0.8 }, // meters
      stepSymmetry: { min: 90, max: 100 }, // percentage
      balanceScore: { min: 85, max: 100 } // percentage
    };
    this.metrics = [];
    this.lastPose = null;
    this.lastTimestamp = null;
  }

  calculateInstantMetrics(currentPose, lastPose, deltaTime) {
    if (!currentPose || !currentPose.keypoints) {
      return {
        timestamp: Date.now(),
        velocity: { x: 0, y: 0 },
        balance: 0,
        symmetry: { overall: 0, legSymmetry: 0, armSymmetry: 0 },
        stability: { score: 0, lateralSway: 0, verticalSway: 0 },
        jointAngles: []
      };
    }

    const velocity = this.calculateVelocity(currentPose, lastPose, deltaTime);
    const balance = this.calculateBalance(currentPose);
    const symmetry = this.calculateSymmetry(currentPose);
    const stability = this.calculateStability(currentPose);
    const jointAngles = this.calculateJointAngles(currentPose);

    const metrics = {
      timestamp: Date.now(),
      velocity,
      balance,
      symmetry,
      stability,
      jointAngles
    };

    this.metrics.push(metrics);
    this.lastPose = currentPose;
    this.lastTimestamp = Date.now();

    return metrics;
  }

  calculateDisplacement(currentPose, lastPose) {
    if (!lastPose || !currentPose) {
      return { x: 0, y: 0 };
    }

    const currentHip = currentPose.keypoints.find(kp => kp.name === 'left_hip');
    const lastHip = lastPose.keypoints.find(kp => kp.name === 'left_hip');

    if (!currentHip || !lastHip) {
      return { x: 0, y: 0 };
    }

    return {
      x: currentHip.x - lastHip.x,
      y: currentHip.y - lastHip.y
    };
  }

  calculateVelocity(currentPose, lastPose, deltaTime) {
    if (!lastPose || !currentPose || deltaTime === 0) {
      return { x: 0, y: 0 };
    }

    const displacement = this.calculateDisplacement(currentPose, lastPose);
    return {
      x: displacement.x / deltaTime,
      y: displacement.y / deltaTime
    };
  }

  calculateBalance(pose) {
    if (!pose || !pose.keypoints) {
      return 0;
    }

    const hipLeft = pose.keypoints.find(kp => kp.name === 'left_hip');
    const hipRight = pose.keypoints.find(kp => kp.name === 'right_hip');
    const shoulderLeft = pose.keypoints.find(kp => kp.name === 'left_shoulder');
    const shoulderRight = pose.keypoints.find(kp => kp.name === 'right_shoulder');

    if (!hipLeft || !hipRight || !shoulderLeft || !shoulderRight) {
      return 0;
    }

    const hipCenter = {
      x: (hipLeft.x + hipRight.x) / 2,
      y: (hipLeft.y + hipRight.y) / 2
    };

    const shoulderCenter = {
      x: (shoulderLeft.x + shoulderRight.x) / 2,
      y: (shoulderLeft.y + shoulderRight.y) / 2
    };

    const verticalAlignment = Math.abs(hipCenter.x - shoulderCenter.x);
    return Math.max(0, 100 - (verticalAlignment * 2));
  }

  calculateSymmetry(pose) {
    if (!pose || !pose.keypoints) {
      return { overall: 0, legSymmetry: 0, armSymmetry: 0 };
    }

    const leftHip = pose.keypoints.find(kp => kp.name === 'left_hip');
    const rightHip = pose.keypoints.find(kp => kp.name === 'right_hip');
    const leftKnee = pose.keypoints.find(kp => kp.name === 'left_knee');
    const rightKnee = pose.keypoints.find(kp => kp.name === 'right_knee');

    if (!leftHip || !rightHip || !leftKnee || !rightKnee) {
      return { overall: 0, legSymmetry: 0, armSymmetry: 0 };
    }

    const leftLegLength = Math.sqrt(
      Math.pow(leftHip.x - leftKnee.x, 2) +
      Math.pow(leftHip.y - leftKnee.y, 2)
    );

    const rightLegLength = Math.sqrt(
      Math.pow(rightHip.x - rightKnee.x, 2) +
      Math.pow(rightHip.y - rightKnee.y, 2)
    );

    const legSymmetry = 100 - Math.abs(leftLegLength - rightLegLength);

    return {
      overall: legSymmetry,
      legSymmetry,
      armSymmetry: 100 // Simplified for now
    };
  }

  calculateStability(pose) {
    if (!pose || !pose.keypoints) {
      return { score: 0, lateralSway: 0, verticalSway: 0 };
    }

    const nose = pose.keypoints.find(kp => kp.name === 'nose');
    const hipLeft = pose.keypoints.find(kp => kp.name === 'left_hip');
    const hipRight = pose.keypoints.find(kp => kp.name === 'right_hip');

    if (!nose || !hipLeft || !hipRight) {
      return { score: 0, lateralSway: 0, verticalSway: 0 };
    }

    const hipCenter = {
      x: (hipLeft.x + hipRight.x) / 2,
      y: (hipLeft.y + hipRight.y) / 2
    };

    const lateralSway = Math.abs(nose.x - hipCenter.x);
    const verticalSway = Math.abs(nose.y - hipCenter.y) / 100;

    const score = Math.max(0, 100 - (lateralSway + verticalSway * 50));

    return { score, lateralSway, verticalSway };
  }

  calculateJointAngles(pose) {
    if (!pose || !pose.keypoints) {
      return [];
    }

    const joints = ['left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle'];
    return joints.map(joint => {
      const keypoint = pose.keypoints.find(kp => kp.name === joint);
      return {
        joint,
        angle: this.calculateJointAngle(pose, joint),
        confidence: keypoint ? keypoint.score : 0
      };
    });
  }

  calculateJointAngle(pose, jointName) {
    // Get the adjacent joints based on the joint name
    const jointConnections = {
      left_hip: ['left_knee', 'left_shoulder'],
      right_hip: ['right_knee', 'right_shoulder'],
      left_knee: ['left_hip', 'left_ankle'],
      right_knee: ['right_hip', 'right_ankle'],
      left_ankle: ['left_knee', null],
      right_ankle: ['right_knee', null]
    };

    const connections = jointConnections[jointName];
    if (!connections) return 0;

    const joint = pose.keypoints.find(kp => kp.name === jointName);
    const joint1 = pose.keypoints.find(kp => kp.name === connections[0]);
    const joint2 = connections[1] ? pose.keypoints.find(kp => kp.name === connections[1]) : null;

    if (!joint || !joint1) return 0;

    if (!joint2) {
      // Calculate angle relative to vertical for end joints
      const dy = joint1.y - joint.y;
      const dx = joint1.x - joint.x;
      return Math.atan2(dy, dx) * (180 / Math.PI);
    }

    // Calculate angle between three points
    const angle1 = Math.atan2(joint1.y - joint.y, joint1.x - joint.x);
    const angle2 = Math.atan2(joint2.y - joint.y, joint2.x - joint.x);
    let angle = (angle1 - angle2) * (180 / Math.PI);

    // Normalize angle to 0-180 range
    if (angle < 0) angle += 360;
    if (angle > 180) angle = 360 - angle;

    return angle;
  }

  calculateAggregateMetrics() {
    if (this.metrics.length === 0) {
      return {
        averageSpeed: 0,
        stabilityTrends: { overallScore: 0 },
        symmetryScore: 0,
        averageStrideLength: 0
      };
    }

    const avgSpeed = this.metrics.reduce((sum, m) => {
      const speed = Math.sqrt(m.velocity.x * m.velocity.x + m.velocity.y * m.velocity.y);
      return sum + speed;
    }, 0) / this.metrics.length;

    const avgStability = this.metrics.reduce((sum, m) => sum + m.stability.score, 0) / this.metrics.length;

    const avgSymmetry = this.metrics.reduce((sum, m) => sum + m.symmetry.overall, 0) / this.metrics.length;

    return {
      averageSpeed: avgSpeed,
      stabilityTrends: {
        overallScore: avgStability,
        timeSeriesData: this.metrics.map(m => ({
          timestamp: m.timestamp,
          stability: m.stability.score,
          lateralSway: m.stability.lateralSway,
          verticalSway: m.stability.verticalSway
        }))
      },
      symmetryScore: avgSymmetry,
      averageStrideLength: 0, // Implement if needed
      timeSeriesData: this.metrics
    };
  }

  compareToBaseline(currentMetrics) {
    if (!this.baselineData) return null;

    return {
      speedDeviation: this.calculateDeviation(
        currentMetrics.averageSpeed,
        this.baselineData.averageSpeed
      ),
      stabilityChange: this.calculateStabilityChange(
        currentMetrics.stabilityTrends,
        this.baselineData.stabilityTrends
      ),
      symmetryChange: this.calculateSymmetryChange(
        currentMetrics.symmetryScore,
        this.baselineData.symmetryScore
      ),
      overallComparison: this.calculateOverallComparison(
        currentMetrics,
        this.baselineData
      )
    };
  }

  // Additional helper methods...
} 